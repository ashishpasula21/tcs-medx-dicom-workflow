import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as dicomParser from 'dicom-parser';
import { useWorkflow } from '../context/WorkflowContext';

interface Rect { x: number; y: number; w: number; h: number; }
interface Annotation extends Rect {
  id: string;
  type: 'Lesion' | 'Tumor';
  label: string;
  widthMm: string;
  heightMm: string;
  areaMm2: string;
}

const PX_TO_MM = 0.352;

// Parse and render a DICOM file to an offscreen canvas. Returns the canvas or null on failure.
async function renderDicomToOffscreen(
  file: File,
  onError: (msg: string) => void,
): Promise<HTMLCanvasElement | null> {
  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    onError('Could not read file.');
    return null;
  }

  const byteArray = new Uint8Array(buffer);

  let dataSet: dicomParser.DataSet;
  try {
    dataSet = dicomParser.parseDicom(byteArray);
  } catch (e) {
    onError(`DICOM parse error: ${(e as Error).message}. File may be corrupted or not a valid DICOM.`);
    return null;
  }

  const rows = dataSet.uint16('x00280010');
  const cols = dataSet.uint16('x00280011');

  if (!rows || !cols) {
    onError('DICOM file has no image dimensions (missing Rows / Columns tags). This may be a metadata-only DICOM.');
    return null;
  }

  const pixelDataElement = dataSet.elements['x7fe00010'];
  if (!pixelDataElement) {
    onError('No pixel data found in this DICOM file.');
    return null;
  }

  const bitsAllocated = dataSet.uint16('x00280100') || 16;
  const pixelRepresentation = dataSet.uint16('x00280103') || 0;
  const samplesPerPixel = dataSet.uint16('x00280002') || 1;
  const rescaleSlope = parseFloat(dataSet.string('x00281053') ?? '') || 1;
  const rescaleIntercept = parseFloat(dataSet.string('x00281052') ?? '') || 0;

  let windowCenter = parseFloat(dataSet.string('x00281050') ?? '');
  let windowWidth = parseFloat(dataSet.string('x00281051') ?? '');

  // Handle JPEG-encapsulated pixel data (compressed DICOM)
  if (pixelDataElement.encapsulatedPixelData) {
    // Try to extract first JPEG fragment and display as image
    const frags = (pixelDataElement as dicomParser.Element & { fragments?: Array<{ dataOffset: number; length: number }> }).fragments;
    if (frags && frags.length > 0) {
      const frag = frags[0];
      const jpegSlice = byteArray.slice(frag.dataOffset, frag.dataOffset + frag.length);
      return new Promise<HTMLCanvasElement | null>(resolve => {
        const blob = new Blob([jpegSlice], { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          const oc = document.createElement('canvas');
          oc.width = img.naturalWidth || cols;
          oc.height = img.naturalHeight || rows;
          oc.getContext('2d')!.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          resolve(oc);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          onError('Compressed DICOM: could not decode JPEG fragment. Try converting to uncompressed first.');
          resolve(null);
        };
        img.src = url;
      });
    }
    onError('Compressed DICOM with no accessible fragments. Use uncompressed or Explicit VR DICOM.');
    return null;
  }

  // Uncompressed pixel data
  const numPixels = rows * cols;
  const bytesPerSample = bitsAllocated / 8;
  const totalBytes = numPixels * samplesPerPixel * bytesPerSample;
  const pixelBuffer = buffer.slice(pixelDataElement.dataOffset, pixelDataElement.dataOffset + totalBytes);

  const offscreen = document.createElement('canvas');
  offscreen.width = cols;
  offscreen.height = rows;
  const ctx = offscreen.getContext('2d')!;
  const imageData = ctx.createImageData(cols, rows);

  if (samplesPerPixel === 3) {
    // RGB color image (8-bit per channel)
    const rgb = new Uint8Array(pixelBuffer);
    for (let i = 0; i < numPixels; i++) {
      imageData.data[i * 4] = rgb[i * 3];
      imageData.data[i * 4 + 1] = rgb[i * 3 + 1];
      imageData.data[i * 4 + 2] = rgb[i * 3 + 2];
      imageData.data[i * 4 + 3] = 255;
    }
  } else {
    // Grayscale — 8-bit or 16-bit
    let pixArray: Uint8Array | Int8Array | Uint16Array | Int16Array;
    if (bitsAllocated === 8) {
      pixArray = pixelRepresentation === 1 ? new Int8Array(pixelBuffer) : new Uint8Array(pixelBuffer);
    } else {
      pixArray = pixelRepresentation === 1 ? new Int16Array(pixelBuffer) : new Uint16Array(pixelBuffer);
    }

    // Auto-window if DICOM header doesn't provide it
    if (isNaN(windowCenter) || isNaN(windowWidth) || windowWidth <= 0) {
      let min = Infinity, max = -Infinity;
      for (let i = 0; i < numPixels; i++) {
        const v = (pixArray[i] as number) * rescaleSlope + rescaleIntercept;
        if (v < min) min = v;
        if (v > max) max = v;
      }
      windowCenter = (min + max) / 2;
      windowWidth = Math.max(max - min, 1);
    }

    const wMin = windowCenter - windowWidth / 2;
    const wMax = windowCenter + windowWidth / 2;

    for (let i = 0; i < numPixels; i++) {
      const hu = (pixArray[i] as number) * rescaleSlope + rescaleIntercept;
      const gray = Math.max(0, Math.min(255, Math.round(((hu - wMin) / (wMax - wMin)) * 255)));
      imageData.data[i * 4] = gray;
      imageData.data[i * 4 + 1] = gray;
      imageData.data[i * 4 + 2] = gray;
      imageData.data[i * 4 + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return offscreen;
}

export default function Screen05() {
  const { updateWorkflowData, completeScreen, completedScreens } = useWorkflow();
  const isDone = completedScreens.includes(5);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Stores either an HTMLImageElement (standard images) or HTMLCanvasElement (DICOM rendered offscreen)
  const imageSourceRef = useRef<HTMLImageElement | HTMLCanvasElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingDicom, setLoadingDicom] = useState(false);
  const [dicomInfo, setDicomInfo] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [curRect, setCurRect] = useState<Rect | null>(null);
  const [tool, setTool] = useState<'Lesion' | 'Tumor'>('Lesion');
  const [signedOff, setSignedOff] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (imageSourceRef.current) {
      ctx.drawImage(imageSourceRef.current, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = loadingDicom ? '#aaa' : '#444';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        loadingDicom ? 'Parsing DICOM file…' : 'Upload a DICOM or image file to begin annotation',
        canvas.width / 2, canvas.height / 2 - 10,
      );
      if (!loadingDicom) {
        ctx.fillStyle = '#333';
        ctx.font = '12px sans-serif';
        ctx.fillText('Supports: DCM, JPG, PNG, BMP', canvas.width / 2, canvas.height / 2 + 14);
      }
    }

    annotations.forEach(ann => {
      const isSelected = ann.id === selectedId;
      ctx.strokeStyle = ann.type === 'Lesion' ? '#ff4444' : '#ffaa00';
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.strokeRect(ann.x, ann.y, ann.w, ann.h);
      const labelBg = ann.type === 'Lesion' ? '#ff4444' : '#ffaa00';
      ctx.fillStyle = labelBg;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      const labelW = ctx.measureText(ann.label).width + 8;
      ctx.fillRect(ann.x, ann.y - 16, labelW, 16);
      ctx.fillStyle = '#fff';
      ctx.fillText(ann.label, ann.x + 4, ann.y - 3);
    });

    if (curRect) {
      ctx.strokeStyle = tool === 'Lesion' ? '#ff4444' : '#ffaa00';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(curRect.x, curRect.y, curRect.w, curRect.h);
      ctx.setLineDash([]);
    }
  }, [annotations, curRect, tool, selectedId, imageLoaded, loadingDicom]);

  useEffect(() => { draw(); }, [draw]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height),
    };
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (signedOff) return;
    const pos = getPos(e);
    setDrawing(true);
    setStartPos(pos);
    setCurRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const pos = getPos(e);
    setCurRect({
      x: Math.min(startPos.x, pos.x), y: Math.min(startPos.y, pos.y),
      w: Math.abs(pos.x - startPos.x), h: Math.abs(pos.y - startPos.y),
    });
  };

  const onMouseUp = () => {
    if (!drawing || !curRect) return;
    setDrawing(false);
    if (curRect.w > 8 && curRect.h > 8) {
      const count = annotations.filter(a => a.type === tool).length + 1;
      setAnnotations(prev => [...prev, {
        id: Date.now().toString(), type: tool, ...curRect, label: `${tool} ${count}`,
        widthMm: (curRect.w * PX_TO_MM).toFixed(1),
        heightMm: (curRect.h * PX_TO_MM).toFixed(1),
        areaMm2: (curRect.w * curRect.h * PX_TO_MM * PX_TO_MM).toFixed(1),
      }]);
    }
    setCurRect(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // reset input so same file can be re-selected

    setLoadError(null);
    setDicomInfo(null);
    setImageLoaded(false);
    imageSourceRef.current = null;
    setAnnotations([]);

    const isDcm = file.name.toLowerCase().endsWith('.dcm') || file.type === 'application/dicom';

    if (isDcm) {
      setLoadingDicom(true);
      draw(); // show "Parsing DICOM…" placeholder

      const onError = (msg: string) => {
        setLoadError(msg);
        setLoadingDicom(false);
      };

      const offscreen = await renderDicomToOffscreen(file, onError);
      if (offscreen) {
        imageSourceRef.current = offscreen;
        setImageLoaded(true);
        setLoadingDicom(false);
        // Extract a summary of DICOM tags for info display
        try {
          const buf = await file.arrayBuffer();
          const ds = dicomParser.parseDicom(new Uint8Array(buf));
          const patient = ds.string('x00100010') || 'Anonymous';
          const modality = ds.string('x00080060') || '?';
          const rows = ds.uint16('x00280010');
          const cols = ds.uint16('x00280011');
          const bits = ds.uint16('x00280100');
          setDicomInfo(`Patient: ${patient} · Modality: ${modality} · ${cols}×${rows} · ${bits}-bit`);
        } catch { /* ignore tag read errors */ }
      }
    } else {
      // Standard image (JPG, PNG, etc.)
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        imageSourceRef.current = img;
        setImageLoaded(true);
      };
      img.onerror = () => {
        setLoadError('Could not load image file. Please upload a valid JPG, PNG, or DCM file.');
      };
      img.src = url;
    }
  };

  const removeAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleSignOff = () => {
    if (annotations.length === 0) return;
    updateWorkflowData({ annotations: annotations.length, annotationSignedOff: true });
    setSignedOff(true);
  };

  return (
    <div>
      <div className="screen-header">
        <div className="screen-tag">Screen 5 of 10</div>
        <div className="screen-title">Reader Annotation View</div>
        <div className="screen-desc">Upload imaging data (DCM, JPG, PNG), annotate lesions and tumors, review measurements, then sign off.</div>
      </div>

      {isDone && (
        <div className="screen-complete-banner">
          ✓ Reader annotation signed off ({annotations.length} annotations). Proceed to IDP Creation.
        </div>
      )}

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          {/* Toolbar */}
          <div className="card" style={{ padding: '10px 14px', marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className={`btn ${tool === 'Lesion' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => setTool('Lesion')} disabled={signedOff}>
                ◻ Lesion
              </button>
              <button className={`btn ${tool === 'Tumor' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => setTool('Tumor')} disabled={signedOff}>
                ◻ Tumor
              </button>
              <span className="text-xs text-muted">
                Active: <strong style={{ color: tool === 'Lesion' ? '#ff4444' : '#ffaa00' }}>{tool}</strong>
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <label className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 12, cursor: 'pointer', marginBottom: 0 }}>
                  {imageLoaded ? '↻ Change Image' : '⬆ Upload Image / DICOM'}
                  <input type="file" accept="image/*,.dcm" style={{ display: 'none' }} onChange={handleFileUpload} disabled={signedOff} />
                </label>
                {annotations.length > 0 && !signedOff && (
                  <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 12, color: 'var(--err)', borderColor: 'var(--err)' }}
                    onClick={() => setAnnotations([])}>Clear All</button>
                )}
              </div>
            </div>
          </div>

          {/* Load error */}
          {loadError && (
            <div className="alert alert-err" style={{ marginBottom: 8 }}>
              <div>
                <strong>Upload Error</strong><br />
                {loadError}
              </div>
            </div>
          )}

          {/* DICOM metadata strip */}
          {dicomInfo && (
            <div className="alert alert-info" style={{ marginBottom: 8, fontSize: 11 }}>
              <span>DICOM: {dicomInfo}</span>
            </div>
          )}

          {/* Canvas */}
          <div className="canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={740}
              height={500}
              style={{ cursor: signedOff ? 'default' : 'crosshair', maxWidth: '100%', display: 'block' }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={() => { if (drawing) { setDrawing(false); setCurRect(null); } }}
            />
          </div>
          {!signedOff && !loadingDicom && (
            <div className="text-xs text-muted mt-8">Draw bounding boxes on the image to annotate. Click an annotation in the list to highlight it.</div>
          )}
        </div>

        {/* Side panel */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div className="card">
            <div className="card-title">Annotations ({annotations.length})</div>
            {annotations.length === 0 ? (
              <div className="text-sm text-muted">No annotations yet. Draw on the image.</div>
            ) : (
              <div className="annotation-list">
                <table className="data-table" style={{ fontSize: 11 }}>
                  <thead><tr><th>Label</th><th>W×H (mm)</th><th></th></tr></thead>
                  <tbody>
                    {annotations.map(ann => (
                      <tr key={ann.id}
                        style={{ cursor: 'pointer', background: selectedId === ann.id ? 'var(--surface)' : undefined }}
                        onClick={() => setSelectedId(ann.id === selectedId ? null : ann.id)}>
                        <td><span style={{ color: ann.type === 'Lesion' ? '#cc2222' : '#b07700', fontWeight: 700 }}>{ann.label}</span></td>
                        <td className="text-muted">{ann.widthMm}×{ann.heightMm}</td>
                        <td>
                          {!signedOff && (
                            <button className="btn btn-danger" style={{ padding: '2px 6px', fontSize: 10, lineHeight: 1 }}
                              onClick={e => { e.stopPropagation(); removeAnnotation(ann.id); }}>×</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedId && (() => {
              const ann = annotations.find(a => a.id === selectedId);
              if (!ann) return null;
              return (
                <div style={{ marginTop: 10, padding: 10, background: 'var(--surface)', border: '1px solid var(--border-light)' }}>
                  <div className="text-xs font-bold mb-8">{ann.label} — Measurements</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <div><div className="text-xs text-muted">Width</div><div className="font-bold">{ann.widthMm} mm</div></div>
                    <div><div className="text-xs text-muted">Height</div><div className="font-bold">{ann.heightMm} mm</div></div>
                    <div><div className="text-xs text-muted">Area</div><div className="font-bold">{ann.areaMm2} mm²</div></div>
                    <div><div className="text-xs text-muted">Type</div><div className="font-bold">{ann.type}</div></div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="card">
            <div className="card-title">Reader Status</div>
            <ul className="check-list">
              <li className="check-item">
                <div className={`check-icon ${imageLoaded ? 'ok' : loadingDicom ? 'warn' : 'pending'}`}>
                  {imageLoaded ? '✓' : loadingDicom ? '⟳' : '1'}
                </div>
                <span className="text-sm">{loadingDicom ? 'Parsing DICOM…' : imageLoaded ? 'Image loaded' : 'Upload an image'}</span>
              </li>
              <li className="check-item">
                <div className={`check-icon ${annotations.length > 0 ? 'ok' : 'pending'}`}>{annotations.length > 0 ? '✓' : '2'}</div>
                <span className="text-sm">At least 1 annotation</span>
              </li>
              <li className="check-item">
                <div className={`check-icon ${signedOff ? 'ok' : 'pending'}`}>{signedOff ? '✓' : '3'}</div>
                <span className="text-sm">Reader signed off</span>
              </li>
            </ul>
            {signedOff && (
              <div className="alert alert-ok mt-12" style={{ fontSize: 12 }}>
                ✓ {annotations.length} marking(s) saved with measurements.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-secondary" onClick={handleSignOff} disabled={annotations.length === 0 || signedOff}>
          {signedOff ? '✓ Signed Off' : 'Reader Sign-Off'}
        </button>
        <button className="btn btn-primary" onClick={() => completeScreen(5)} disabled={!signedOff || isDone}>
          {isDone ? '✓ Completed' : 'Proceed to IDP Creation →'}
        </button>
      </div>
    </div>
  );
}
