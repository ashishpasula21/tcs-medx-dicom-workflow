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
  preset: boolean;
  confirmed: boolean;
}

const PX_TO_MM = 0.352;

const PRESET_ANNOTATIONS: Annotation[] = [
  {
    id: 'preset-1', type: 'Lesion', label: 'Nodule 1',
    x: 195, y: 145, w: 115, h: 105,
    widthMm: (115 * PX_TO_MM).toFixed(1), heightMm: (105 * PX_TO_MM).toFixed(1),
    areaMm2: (115 * 105 * PX_TO_MM * PX_TO_MM).toFixed(1),
    preset: true, confirmed: false,
  },
  {
    id: 'preset-2', type: 'Lesion', label: 'Nodule 2',
    x: 385, y: 155, w: 90, h: 82,
    widthMm: (90 * PX_TO_MM).toFixed(1), heightMm: (82 * PX_TO_MM).toFixed(1),
    areaMm2: (90 * 82 * PX_TO_MM * PX_TO_MM).toFixed(1),
    preset: true, confirmed: false,
  },
  {
    id: 'preset-3', type: 'Tumor', label: 'Mass 1',
    x: 275, y: 295, w: 140, h: 95,
    widthMm: (140 * PX_TO_MM).toFixed(1), heightMm: (95 * PX_TO_MM).toFixed(1),
    areaMm2: (140 * 95 * PX_TO_MM * PX_TO_MM).toFixed(1),
    preset: true, confirmed: false,
  },
];

function annColor(ann: Annotation): string {
  if (ann.preset) return '#f59e0b';
  return ann.type === 'Lesion' ? '#ff4444' : '#ffaa00';
}

async function renderDicomBuffer(
  buffer: ArrayBuffer,
  onError: (msg: string) => void,
): Promise<HTMLCanvasElement | null> {
  const byteArray = new Uint8Array(buffer);

  let dataSet: dicomParser.DataSet;
  try {
    dataSet = dicomParser.parseDicom(byteArray);
  } catch (e) {
    onError(`DICOM parse error: ${(e as Error).message}.`);
    return null;
  }

  const rows = dataSet.uint16('x00280010');
  const cols = dataSet.uint16('x00280011');

  if (!rows || !cols) {
    onError('DICOM file has no image dimensions (missing Rows / Columns tags).');
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

  if (pixelDataElement.encapsulatedPixelData) {
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
          onError('Compressed DICOM: could not decode JPEG fragment.');
          resolve(null);
        };
        img.src = url;
      });
    }
    onError('Compressed DICOM with no accessible fragments.');
    return null;
  }

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
    const rgb = new Uint8Array(pixelBuffer);
    for (let i = 0; i < numPixels; i++) {
      imageData.data[i * 4] = rgb[i * 3];
      imageData.data[i * 4 + 1] = rgb[i * 3 + 1];
      imageData.data[i * 4 + 2] = rgb[i * 3 + 2];
      imageData.data[i * 4 + 3] = 255;
    }
  } else {
    let pixArray: Uint8Array | Int8Array | Uint16Array | Int16Array;
    if (bitsAllocated === 8) {
      pixArray = pixelRepresentation === 1 ? new Int8Array(pixelBuffer) : new Uint8Array(pixelBuffer);
    } else {
      pixArray = pixelRepresentation === 1 ? new Int16Array(pixelBuffer) : new Uint16Array(pixelBuffer);
    }

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
  const imageSourceRef = useRef<HTMLCanvasElement | null>(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingDicom, setLoadingDicom] = useState(true);
  const [dicomInfo, setDicomInfo] = useState<string | null>(null);

  const [annotations, setAnnotations] = useState<Annotation[]>(PRESET_ANNOTATIONS);
  const [drawing, setDrawing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [curRect, setCurRect] = useState<Rect | null>(null);
  const [tool, setTool] = useState<'Lesion' | 'Tumor'>('Lesion');
  const [signedOff, setSignedOff] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editType, setEditType] = useState<'Lesion' | 'Tumor'>('Lesion');

  // Auto-load DICOM on mount
  useEffect(() => {
    (async () => {
      setLoadingDicom(true);
      try {
        const resp = await fetch('/MRBRAIN.DCM');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const buffer = await resp.arrayBuffer();
        const offscreen = await renderDicomBuffer(buffer, msg => setLoadError(msg));
        if (offscreen) {
          imageSourceRef.current = offscreen;
          setImageLoaded(true);
          try {
            const ds = dicomParser.parseDicom(new Uint8Array(buffer));
            const patient = ds.string('x00100010') || 'Anonymous';
            const modality = ds.string('x00080060') || 'MR';
            const r = ds.uint16('x00280010');
            const c = ds.uint16('x00280011');
            const bits = ds.uint16('x00280100');
            setDicomInfo(`Patient: ${patient} · Modality: ${modality} · ${c}×${r} · ${bits}-bit`);
          } catch { /* ignore tag read errors */ }
        }
      } catch (e) {
        setLoadError(`Failed to load MRBRAIN.DCM: ${(e as Error).message}`);
      } finally {
        setLoadingDicom(false);
      }
    })();
  }, []);

  // Sync edit panel when selection changes
  useEffect(() => {
    const ann = annotations.find(a => a.id === selectedId);
    if (ann) {
      setEditLabel(ann.label);
      setEditType(ann.type);
    }
  }, [selectedId]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (imageSourceRef.current) {
      ctx.drawImage(imageSourceRef.current, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = loadingDicom ? '#aaa' : '#555';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(loadingDicom ? 'Loading MRBRAIN.DCM…' : 'Failed to load image', canvas.width / 2, canvas.height / 2);
    }

    annotations.forEach(ann => {
      const isSelected = ann.id === selectedId;
      const color = annColor(ann);
      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.setLineDash(ann.confirmed ? [] : [6, 4]);
      ctx.strokeRect(ann.x, ann.y, ann.w, ann.h);
      ctx.setLineDash([]);

      // Label badge
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      const labelText = ann.label + (ann.preset && !ann.confirmed ? ' (AI)' : '');
      const labelW = ctx.measureText(labelText).width + 8;
      ctx.fillStyle = color;
      ctx.fillRect(ann.x, ann.y - 17, labelW, 17);
      ctx.fillStyle = '#fff';
      ctx.fillText(labelText, ann.x + 4, ann.y - 3);

      if (ann.confirmed) {
        ctx.fillStyle = color;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('✓', ann.x + ann.w - 3, ann.y + 14);
      }
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

  const hitTest = (pos: { x: number; y: number }) => {
    for (let i = annotations.length - 1; i >= 0; i--) {
      const a = annotations[i];
      if (pos.x >= a.x && pos.x <= a.x + a.w && pos.y >= a.y && pos.y <= a.y + a.h) return a;
    }
    return null;
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (signedOff) return;
    const pos = getPos(e);
    const hit = hitTest(pos);
    if (hit) {
      setSelectedId(hit.id);
      setDragging(true);
      setDragOffset({ x: pos.x - hit.x, y: pos.y - hit.y });
    } else {
      setSelectedId(null);
      setDrawing(true);
      setStartPos(pos);
      setCurRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
    }
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getPos(e);
    if (dragging && selectedId) {
      setAnnotations(prev => prev.map(a => {
        if (a.id !== selectedId) return a;
        return { ...a, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
      }));
    } else if (drawing) {
      setCurRect({
        x: Math.min(startPos.x, pos.x), y: Math.min(startPos.y, pos.y),
        w: Math.abs(pos.x - startPos.x), h: Math.abs(pos.y - startPos.y),
      });
    }
  };

  const onMouseUp = () => {
    if (dragging) { setDragging(false); return; }
    if (!drawing || !curRect) return;
    setDrawing(false);
    if (curRect.w > 8 && curRect.h > 8) {
      const count = annotations.filter(a => a.type === tool && !a.preset).length + 1;
      const newAnn: Annotation = {
        id: Date.now().toString(), type: tool, ...curRect,
        label: `${tool} ${count}`,
        widthMm: (curRect.w * PX_TO_MM).toFixed(1),
        heightMm: (curRect.h * PX_TO_MM).toFixed(1),
        areaMm2: (curRect.w * curRect.h * PX_TO_MM * PX_TO_MM).toFixed(1),
        preset: false, confirmed: true,
      };
      setAnnotations(prev => [...prev, newAnn]);
      setSelectedId(newAnn.id);
    }
    setCurRect(null);
  };

  const confirmAnnotation = (id: string) => {
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, confirmed: true } : a));
  };

  const confirmAll = () => {
    setAnnotations(prev => prev.map(a => ({ ...a, confirmed: true })));
  };

  const applyLabelEdit = () => {
    if (!selectedId) return;
    setAnnotations(prev => prev.map(a => a.id === selectedId ? { ...a, label: editLabel } : a));
  };

  const removeAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleSignOff = () => {
    const confirmed = annotations.filter(a => a.confirmed);
    if (confirmed.length === 0) return;
    updateWorkflowData({ annotations: annotations.length, annotationSignedOff: true });
    setSignedOff(true);
  };

  const confirmedCount = annotations.filter(a => a.confirmed).length;
  const unconfirmedPreset = annotations.filter(a => a.preset && !a.confirmed);
  const selectedAnn = annotations.find(a => a.id === selectedId);

  return (
    <div>
      <div className="screen-header">
        <div className="screen-tag">Screen 5 of 10  ·  IAE CareSphere Dx</div>
        <div className="screen-title">Reader Annotation View</div>
        <div className="screen-desc">Review AI-detected annotations on the pre-loaded DICOM image. Confirm, edit, or add findings, then sign off.</div>
      </div>

      {isDone && <div className="screen-complete-banner">✓ Reader annotation signed off ({annotations.length} annotations). Proceed to MCD Bundle.</div>}

      {unconfirmedPreset.length > 0 && !signedOff && (
        <div className="alert alert-warn" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span>⚠ <strong>{unconfirmedPreset.length} AI annotation{unconfirmedPreset.length > 1 ? 's' : ''}</strong> pending review — confirm or edit before signing off.</span>
          <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 12, flexShrink: 0 }} onClick={confirmAll}>
            Confirm All
          </button>
        </div>
      )}

      {loadError && <div className="alert alert-err" style={{ marginBottom: 12 }}>{loadError}</div>}
      {dicomInfo && <div className="alert alert-info" style={{ marginBottom: 8, fontSize: 11 }}>DICOM: {dicomInfo}</div>}

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          {/* Toolbar */}
          <div className="card" style={{ padding: '10px 14px', marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="text-xs" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#666' }}>Draw:</span>
              <button className={`btn ${tool === 'Lesion' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => setTool('Lesion')} disabled={signedOff}>
                ◻ Lesion
              </button>
              <button className={`btn ${tool === 'Tumor' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => setTool('Tumor')} disabled={signedOff}>
                ◻ Tumor
              </button>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
                {[
                  { dash: true, color: '#f59e0b', label: 'AI (unconfirmed)' },
                  { dash: false, color: '#f59e0b', label: 'AI (confirmed)' },
                  { dash: false, color: '#ff4444', label: 'User-added' },
                ].map(({ dash, color, label }) => (
                  <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#888' }}>
                    <svg width="18" height="6">
                      <line x1="0" y1="3" x2="18" y2="3" stroke={color} strokeWidth="2"
                        strokeDasharray={dash ? '4 3' : undefined} />
                    </svg>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={740}
              height={500}
              style={{ cursor: signedOff ? 'default' : dragging ? 'grabbing' : 'crosshair', maxWidth: '100%', display: 'block' }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={() => {
                if (drawing) { setDrawing(false); setCurRect(null); }
                if (dragging) setDragging(false);
              }}
            />
          </div>
          {!signedOff && (
            <div className="text-xs text-muted mt-8">
              Click an annotation to select it and drag to reposition. Draw new bounding boxes to add findings.
            </div>
          )}
        </div>

        {/* Side panel */}
        <div style={{ width: 290, flexShrink: 0 }}>
          {/* Edit panel */}
          {selectedAnn && !signedOff && (
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="card-title" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                Edit Annotation
                {selectedAnn.preset && <span className="badge badge-warn" style={{ fontSize: 10 }}>AI</span>}
                {selectedAnn.confirmed && <span className="badge badge-ok" style={{ fontSize: 10 }}>Confirmed</span>}
              </div>
              <div className="form-group" style={{ marginBottom: 8 }}>
                <label className="form-label" style={{ fontSize: 11 }}>Label</label>
                <input
                  className="form-input" style={{ fontSize: 12, padding: '5px 8px' }}
                  value={editLabel}
                  onChange={e => setEditLabel(e.target.value)}
                  onBlur={applyLabelEdit}
                  onKeyDown={e => { if (e.key === 'Enter') applyLabelEdit(); }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 10 }}>
                <label className="form-label" style={{ fontSize: 11 }}>Type</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['Lesion', 'Tumor'] as const).map(t => (
                    <button key={t}
                      className={`btn ${editType === t ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, padding: '4px 0', fontSize: 11 }}
                      onClick={() => {
                        setEditType(t);
                        setAnnotations(prev => prev.map(a => a.id === selectedId ? { ...a, type: t } : a));
                      }}
                    >{t}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
                <div><div className="text-xs text-muted">Width</div><div style={{ fontSize: 13, fontWeight: 700 }}>{selectedAnn.widthMm} mm</div></div>
                <div><div className="text-xs text-muted">Height</div><div style={{ fontSize: 13, fontWeight: 700 }}>{selectedAnn.heightMm} mm</div></div>
                <div><div className="text-xs text-muted">Area</div><div style={{ fontSize: 13, fontWeight: 700 }}>{selectedAnn.areaMm2} mm²</div></div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {!selectedAnn.confirmed && (
                  <button className="btn btn-success" style={{ flex: 1, padding: '6px 0', fontSize: 11 }}
                    onClick={() => confirmAnnotation(selectedAnn.id)}>✓ Confirm</button>
                )}
                <button className="btn btn-danger" style={{ flex: 1, padding: '6px 0', fontSize: 11 }}
                  onClick={() => removeAnnotation(selectedAnn.id)}>✗ Remove</button>
              </div>
            </div>
          )}

          {/* Annotations list */}
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-title">Annotations ({annotations.length})</div>
            {annotations.length === 0 ? (
              <div className="text-sm text-muted">No annotations yet.</div>
            ) : (
              <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                {annotations.map(ann => (
                  <div key={ann.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px',
                      cursor: 'pointer', marginBottom: 2,
                      background: selectedId === ann.id ? 'var(--surface)' : '#fff',
                      border: `1px solid ${selectedId === ann.id ? 'var(--border-light)' : 'transparent'}`,
                    }}
                    onClick={() => setSelectedId(ann.id === selectedId ? null : ann.id)}
                  >
                    <div style={{
                      width: 8, height: 8, flexShrink: 0, borderRadius: '50%',
                      background: ann.confirmed ? annColor(ann) : 'transparent',
                      border: `2px ${ann.confirmed ? 'solid' : 'dashed'} ${annColor(ann)}`,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: annColor(ann) }}>{ann.label}</div>
                      <div style={{ fontSize: 10, color: '#888' }}>{ann.widthMm}×{ann.heightMm} mm · {ann.type}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {ann.preset && !ann.confirmed && (
                        <button className="btn btn-success" style={{ padding: '2px 6px', fontSize: 10, lineHeight: 1 }}
                          onClick={e => { e.stopPropagation(); confirmAnnotation(ann.id); }}>✓</button>
                      )}
                      {!signedOff && (
                        <button className="btn btn-danger" style={{ padding: '2px 6px', fontSize: 10, lineHeight: 1 }}
                          onClick={e => { e.stopPropagation(); removeAnnotation(ann.id); }}>×</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {unconfirmedPreset.length > 0 && !signedOff && (
              <button className="btn btn-secondary" style={{ width: '100%', marginTop: 8, padding: '6px 0', fontSize: 11 }}
                onClick={confirmAll}>
                ✓ Confirm All AI Findings
              </button>
            )}
          </div>

          {/* Reader status */}
          <div className="card">
            <div className="card-title">Reader Status</div>
            <ul className="check-list">
              <li className="check-item">
                <div className={`check-icon ${imageLoaded ? 'ok' : loadingDicom ? 'warn' : 'err'}`}>
                  {imageLoaded ? '✓' : loadingDicom ? '⟳' : '✗'}
                </div>
                <span className="text-sm">{loadingDicom ? 'Loading DICOM…' : imageLoaded ? 'DICOM loaded' : 'Load failed'}</span>
              </li>
              <li className="check-item">
                <div className={`check-icon ${confirmedCount > 0 ? 'ok' : 'pending'}`}>{confirmedCount > 0 ? '✓' : '2'}</div>
                <span className="text-sm">{confirmedCount} / {annotations.length} annotations confirmed</span>
              </li>
              <li className="check-item">
                <div className={`check-icon ${signedOff ? 'ok' : 'pending'}`}>{signedOff ? '✓' : '3'}</div>
                <span className="text-sm">Reader signed off</span>
              </li>
            </ul>
            {signedOff && (
              <div className="alert alert-ok mt-12" style={{ fontSize: 12 }}>
                ✓ {annotations.length} annotation(s) saved with measurements.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="btn-group">
        <button className="btn btn-secondary" onClick={handleSignOff} disabled={confirmedCount === 0 || signedOff}>
          {signedOff ? '✓ Signed Off' : 'Reader Sign-Off'}
        </button>
        <button className="btn btn-primary" onClick={() => completeScreen(5)} disabled={!signedOff || isDone}>
          {isDone ? '✓ Completed' : 'Proceed to MCD Bundle →'}
        </button>
      </div>
    </div>
  );
}
