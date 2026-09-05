import React, { useState, useEffect } from 'react';
import { Bell, MapPin, Clock, User, Camera, Check, CheckCircle2, ArrowLeft, ArrowRight, ShieldCheck, RefreshCw, Radio, Plus, Save, Navigation, Users, TrendingUp, TrendingDown, Loader2, X, ZoomIn, AlertTriangle, Phone, PackageCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { echo } from '../../services/echo';
import { get, set, del } from 'idb-keyval';
import { BarcodeScanner } from '../../components/BarcodeScanner';
import './TugasSaya.css';

export const TugasSaya = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Semua');
  const [selectedTask, setSelectedTask] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); 
  const [maxStepReached, setMaxStepReached] = useState(1);
  
  // New States for Docs & Assets
  const [assetPhotos, setAssetPhotos] = useState({}); // { 0: [], 1: [] }
  const [docPhotos, setDocPhotos] = useState({
    ont: [],
    lokasi: [],
    kabel: [],
    hasil: [],
    before: [],
    after: []
  });
  const [uploadingState, setUploadingState] = useState({}); // { category: boolean }
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [catatan, setCatatan] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [rootCauseOther, setRootCauseOther] = useState('');
  const [needsReplacement, setNeedsReplacement] = useState(false);
  const [replacementNotes, setReplacementNotes] = useState('');
  const [realtimeAlert, setRealtimeAlert] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeScanItem, setActiveScanItem] = useState(null);

  // Field Workflow States
  const [isReplacingModem, setIsReplacingModem] = useState(false);
  const [modemOldSn, setModemOldSn] = useState('');
  const [modemNewSn, setModemNewSn] = useState('');
  const [modemNewAssetId, setModemNewAssetId] = useState('');
  const [modemOldHasAdaptor, setModemOldHasAdaptor] = useState(true);

  const [additionalMaterials, setAdditionalMaterials] = useState([]);
  const [showAddMat, setShowAddMat] = useState(false);
  const [returnedMaterials, setReturnedMaterials] = useState([]);
  const [showReturnMat, setShowReturnMat] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [matQty, setMatQty] = useState('1');
  const [matStockCategory, setMatStockCategory] = useState('Baru');
  const [modemReturned, setModemReturned] = useState({ asset_id: '', condition: 'Baik' });
  const [adaptorReturned, setAdaptorReturned] = useState({ asset_id: '', condition: 'Baik' });
  const [matCondition, setMatCondition] = useState('Baik');
  const [selectedOdpId, setSelectedOdpId] = useState('');
  const [odpPort, setOdpPort] = useState('');
  const [showOdpMigration, setShowOdpMigration] = useState(false);
  const [redamanDbm, setRedamanDbm] = useState('');
  const [gpsCoords, setGpsCoords] = useState({ latitude: null, longitude: null });

  const queryClient = useQueryClient();
  const techId = localStorage.getItem('user_id');

  const { data: assetsList = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const res = await fetch('/api/assets');
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    }
  });

  const { data: odpList = [] } = useQuery({
    queryKey: ['odps'],
    queryFn: async () => {
      const res = await fetch('/api/odps');
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    }
  });

  const { data: odpPorts = [], isLoading: isLoadingPorts } = useQuery({
    queryKey: ['odp-ports', selectedOdpId || (selectedTask ? selectedTask.odp_id : '')],
    queryFn: async () => {
      const id = selectedOdpId || (selectedTask ? selectedTask.odp_id : '');
      if (!id) return [];
      const res = await fetch(`/api/odps/${id}/ports`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!selectedOdpId || !!(selectedTask && selectedTask.odp_id)
  });


  const { data: taskList = [], isLoading: loading, refetch: fetchTasks } = useQuery({
    queryKey: ['tasks', techId],
    queryFn: async () => {
      const token = localStorage.getItem('sanctum_token');
      if (!token) {
        localStorage.clear();
        window.location.href = '/teknisi/login';
        return [];
      }
      const res = await fetch(`/api/tasks?technician_id=${techId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.status === 401) {
        localStorage.clear();
        window.location.href = '/teknisi/login';
        return [];
      }
      if (!res.ok) throw new Error('Network error');
      const json = await res.json();
      if (json.success && json.data && Array.isArray(json.data)) {
        return json.data.map((item, idx) => ({
          id: item.id || idx + 1,
          type: item.type || 'Pasang Baru',
          typeBg: item.type === 'Perbaikan Gangguan' ? '#FEE2E2' : (item.type === 'Pencabutan' ? '#FEF3C7' : '#DBEAFE'),
          typeColor: item.type === 'Perbaikan Gangguan' ? '#DC2626' : (item.type === 'Pencabutan' ? '#D97706' : '#2563EB'),
          status: item.status === 'Selesai' ? 'Selesai' : (item.status === 'Dikerjakan' ? 'Progress' : 'Pending'),
          name: item.customer?.name || (item.title ? String(item.title).replace(/^.*?\s*-\s*/, '') : '-'),
          address: item.customer?.address || item.description || '-',
          phone: String(item.customer?.phone || '081234567890'),
          odp: item.odp?.name || '-',
          date: item.created_at ? String(item.created_at).split('T')[0] : '2024-07-01',
          created_at: item.created_at,
          started_at: item.started_at,
          completed_at: item.completed_at,
          technician: item.technician?.name || '-',
          items: (item.type === 'Pembangunan' || item.type === 'Pembangunan Jaringan') ? [
            { name: 'Boks ODP (Scan SN / Barcode)', sn: item.odp?.serial_number || '', verified: !!item.odp?.serial_number, photos: 0 },
            { name: 'Passive Splitter 1:8 / 1:16', sn: '1 Pcs', verified: true, photos: 0 },
            { name: 'Kabel Distribusi FO', sn: item.kabel_fo_used || '', verified: !!item.kabel_fo_used, photos: 0 }
          ] : (item.type === 'Perbaikan Gangguan' || item.type === 'Pemeliharaan') ? [] : [
            { name: 'ONT Dual Band Wi-Fi 6', sn: item.modem_sn || '', verified: !!item.modem_sn, photos: 0 },
            { name: 'Kabel Drop FO', sn: item.kabel_fo_used || '', verified: !!item.kabel_fo_used, photos: 0 }
          ]
        }));
      }
      return [];
    }
  });

  const startTaskMutation = useMutation({
    mutationFn: async (taskId) => {
      const res = await fetch(`/api/tasks/${taskId}/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error('Network error');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', techId] });
    },
    onError: () => {
      toast.error('Gagal memulai tugas');
    }
  });

  const takeAssetMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch('/api/assets/take', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Stok tidak mencukupi atau SN tidak valid!');
      return { json, payload };
    }
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch(`/api/tasks/${payload.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload.data)
      });
      if (!res.ok) throw new Error('Gagal menyelesaikan tugas');
      return res.json();
    },
    onSuccess: () => {
      toast.success('🎉 Tugas Selesai! Data berhasil dikirim.');
      queryClient.invalidateQueries({ queryKey: ['tasks', techId] });
      setCurrentStep(3);
    },
    onError: () => {
      toast.error('❌ Gagal mengirim laporan ke server. Silakan coba lagi.');
    }
  });

  useEffect(() => {
    if (echo) {
      const channel = echo.channel('tasks');
      channel.listen('.TaskUpdated', () => {
        setRealtimeAlert('🔔 Update tugas baru dari Admin Proxmox!');
        queryClient.invalidateQueries({ queryKey: ['tasks', techId] });
        setTimeout(() => setRealtimeAlert(null), 5000);
      });
      return () => {
        echo.leave('tasks');
      };
    }
  }, [queryClient, techId]);

  const filteredTasks = taskList.filter(task => {
    if (activeTab === 'Semua') return true;
    return task.status === activeTab;
  });

  const loadTaskProgress = async (taskId) => {
    try {
      const savedAssets = await get(`assetPhotos_${taskId}`);
      const savedDocs = await get(`docPhotos_${taskId}`);
      const savedNotes = await get(`catatan_${taskId}`);
      const savedStep = await get(`currentStep_${taskId}`);

      if (savedStep) setCurrentStep(savedStep);

      if (savedAssets) {
        const restoredAssets = {};
        for (const idx in savedAssets) {
          restoredAssets[idx] = savedAssets[idx].map(file => ({ file, url: URL.createObjectURL(file) }));
        }
        setAssetPhotos(restoredAssets);
      }
      
      if (savedDocs) {
        const restoredDocs = {};
        for (const cat in savedDocs) {
          restoredDocs[cat] = savedDocs[cat].map(file => ({ file, url: URL.createObjectURL(file) }));
        }
        setDocPhotos({ ...docPhotos, ...restoredDocs });
      }

      const savedRootCause = await get(`rootCause_${taskId}`);
      const savedRootCauseOther = await get(`rootCauseOther_${taskId}`);
      if (savedRootCause !== undefined) setRootCause(savedRootCause);
      if (savedRootCauseOther !== undefined) setRootCauseOther(savedRootCauseOther);

      if (savedNotes !== undefined) setCatatan(savedNotes);
    } catch (e) {
      console.log('Failed to load progress from IDB', e);
    }
  };

  const handleStartTask = async (task, e) => {
    if (e) e.stopPropagation();
    setSelectedTask(task);
    setCurrentStep(1);
    setAssetPhotos({});
    setDocPhotos({ lokasi: [], ont: [], kabel: [], hasil: [], before: [], after: [] });
    setCatatan('');
    setRootCause('');
    setRootCauseOther('');
    if (task.status !== 'Progress') {
      startTaskMutation.mutate(task.id);
    } else {
      loadTaskProgress(task.id);
    }
  };

  const handleViewTask = (task) => {
    setSelectedTask(task);
    if (task.status === 'Selesai') setCurrentStep(3);
    else if (task.status === 'Progress') loadTaskProgress(task.id);
    else setCurrentStep(1); 
  };

  const handleLogout = () => {
    navigate('/teknisi/login');
  };

  const processScan = (item, idx, inputSn) => {
    if (!inputSn) return;
    const isKabel = String(item?.name || '').toLowerCase().includes('kabel');
    const qty = isKabel ? (parseInt(String(inputSn || '').replace(/[^0-9]/g, '')) || 1) : 1;
    const cleanSn = isKabel ? null : String(inputSn).trim();

    const payload = {
      asset_id: isKabel 
        ? ((Array.isArray(assetsList) ? assetsList : []).find(a => String(a.name||'').toLowerCase().includes('kabel') || String(a.category||'').toLowerCase().includes('kabel'))?.id || 2) 
        : ((Array.isArray(assetsList) ? assetsList : []).find(a => String(a.name||'').toLowerCase().includes('modem') || String(a.name||'').toLowerCase().includes('ont'))?.id || 1),
      asset_type: isKabel ? 'Kabel' : 'Modem',
      quantity: qty,
      serial_number: cleanSn,
      task_id: selectedTask?.id,
      technician_id: selectedTask?.technician_id || 1
    };

    takeAssetMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(`Stok ${item?.name || 'Aset'} berhasil dicatat (${isKabel ? `${qty} Meter` : `SN: ${cleanSn}`}).`);
        const formatted = isKabel ? `${qty} Meter` : cleanSn;
        const updatedItems = (selectedTask?.items || []).map((it, i) => i === idx ? { ...it, sn: formatted, verified: true } : it);
        setSelectedTask({ ...selectedTask, items: updatedItems });
      },
      onError: (err) => {
        toast.error('Gagal memotong stok: ' + err.message);
      }
    });
  };

  const handleScanSN = (item, idx) => {
    const isKabel = String(item?.name || '').toLowerCase().includes('kabel');
    const label = isKabel ? `📏 Masukkan panjang kabel yang dipakai (Meter) untuk ${item?.name || 'Aset'}:` : `🏷️ Masukkan SN / MAC / Kode Aset untuk ${item?.name || 'Aset'}:`;
    const inputSn = prompt(label, item?.sn || '');
    if (inputSn) {
      const updatedItems = (selectedTask?.items || []).map((it, i) => i === idx ? { ...it, sn: isKabel && !String(inputSn || '').toLowerCase().includes('meter') ? `${inputSn} Meter` : inputSn, verified: true } : it);
      setSelectedTask({ ...selectedTask, items: updatedItems });
    }
  };

  const handleCompleteTask = async () => {
    const modemItem = selectedTask.items.find(i => i.name.includes('ONT'));
    const kabelItem = selectedTask.items.find(i => i.name.includes('Kabel'));
    const isGangguan = selectedTask?.type === 'Perbaikan Gangguan' || selectedTask?.type === 'Pemeliharaan';
    const isPencabutan = selectedTask?.type === 'Pencabutan';

    if (isPencabutan) {
      if (!docPhotos.modem_ditarik || docPhotos.modem_ditarik.length === 0) {
        toast.error('❌ Wajib melampirkan Foto Modem yang Ditarik!');
        return;
      }
      if (!docPhotos.adaptor_ditarik || docPhotos.adaptor_ditarik.length === 0) {
        toast.error('❌ Wajib melampirkan Foto Adaptor yang Ditarik!');
        return;
      }
      if (!modemReturned.asset_id || !adaptorReturned.asset_id) {
        toast.error('❌ Wajib memilih Modem dan Adaptor yang ditarik beserta kondisinya!');
        return;
      }
    } else if (isGangguan) {
      if (!docPhotos.before || docPhotos.before.length === 0) {
        toast.error('⚠️ Wajib melampirkan Foto Before (Bukti Gangguan / LOS / OPM jelek)!');
        return;
      }
      if (!docPhotos.after || docPhotos.after.length === 0) {
        toast.error('⚠️ Wajib melampirkan Foto After (Bukti Normal / PON Hijau / Speedtest)!');
        return;
      }
      if (!rootCause) {
        toast.error('⚠️ Wajib memilih Penyebab Gangguan (Root Cause)!');
        return;
      }
      if (rootCause === 'Lainnya' && !rootCauseOther) {
        toast.error('⚠️ Wajib menuliskan spesifik penyebab gangguan lainnya!');
        return;
      }
      if (isGangguan && isReplacingModem) {
        if (!modemOldSn) {
          toast.error('⚠️ Wajib Scan / Input Serial Number (SN) Modem Lama yang ditarik!');
          return;
        }
        if (!modemNewSn || !modemNewAssetId) {
          toast.error('⚠️ Wajib memilih dan Scan / Input Serial Number (SN) Modem Baru pengganti!');
          return;
        }
      }
    } else if (!isPencabutan && !isGangguan) {
        // Pemasangan Baru
        for (let i = 0; i < (selectedTask?.items || []).length; i++) {
          const item = selectedTask.items[i];
          const isKabel = String(item?.name || '').toLowerCase().includes('kabel');
          if (!isKabel) {
            if (!item?.sn && !item?.verified) {
              toast.error(`⚠️ Wajib Scan / Input Serial Number (SN) untuk perangkat: ${item.name}!`);
              return;
            }
            if (!docPhotos[`ont_assign_${i}`] || docPhotos[`ont_assign_${i}`].length === 0) {
              toast.error(`⚠️ Wajib upload Foto Perangkat Terpasang untuk: ${item.name}!`);
              return;
            }
          }
        }
      }

      if (!isPencabutan) {
        for (let i = 0; i < (additionalMaterials || []).length; i++) {
          const mat = additionalMaterials[i];
          const isKabel = String(mat?.name || '').toLowerCase().includes('kabel');
          if (!isKabel) {
            if (!docPhotos[`ont_add_${i}`] || docPhotos[`ont_add_${i}`].length === 0) {
              toast.error(`⚠️ Wajib upload Foto Perangkat Terpasang untuk Aset Tambahan: ${mat.name}!`);
              return;
            }
          }
        }
      }
    if (!isGangguan && (!docPhotos.lokasi || docPhotos.lokasi.length === 0)) {
      toast.error('⚠️ Wajib melampirkan Foto Rumah Pelanggan!');
      return;
    }

    if (odpPort) {
      const portInfo = odpPorts.find(p => String(p.port_number) === String(odpPort));
      if (portInfo && portInfo.is_used) {
        toast.error(`⚠️ GAGAL! Port ${odpPort} sudah terpakai oleh pelanggan aktif (${portInfo.customer_name || 'lain'}). Silakan pilih port yang kosong!`);
        return;
      }
    }

    const sendCompletion = (locationStr, lat, lng) => {
      const formatPhotoNote = (url) => (!url || url === '-' ? '-' : (String(url).startsWith('data:') ? '[✔ Foto Tersimpan di Lampiran]' : url));
      const notesPrefix = isPencabutan ? 
        `[📦 Foto Modem Ditarik: ${formatPhotoNote(docPhotos.modem_ditarik?.[0]?.url)}]\n[🔌 Foto Adaptor Ditarik: ${formatPhotoNote(docPhotos.adaptor_ditarik?.[0]?.url)}]\n\n` :
        (isGangguan ? 
          `[🔍 Root Cause: ${rootCause === 'Lainnya' ? rootCauseOther : rootCause}]\n` +
          (isReplacingModem ? `[🔄 Pergantian Modem: SN Lama (${modemOldSn}) ➔ SN Baru (${modemNewSn})]\n` : '') +
          `[📸 Foto Before: ${formatPhotoNote(docPhotos.before?.[0]?.url)}]\n` +
          `[📸 Foto After: ${formatPhotoNote(docPhotos.after?.[0]?.url)}]\n\n` : '');

      let pemBaruPhotos = '';
      if (!isPencabutan && !isGangguan) {
        const assignPhotos = Object.keys(docPhotos).filter(k => k.startsWith('ont_assign_')).map(k => `[📸 Foto Perangkat Assign: ${formatPhotoNote(docPhotos[k]?.[0]?.url)}]`);
        const addPhotos = Object.keys(docPhotos).filter(k => k.startsWith('ont_add_')).map(k => `[📸 Foto Perangkat Tambahan: ${formatPhotoNote(docPhotos[k]?.[0]?.url)}]`);
        const allPhotos = [...assignPhotos, ...addPhotos];
        if (allPhotos.length > 0) pemBaruPhotos = allPhotos.join('\n') + '\n\n';
      }

      let finalReturnedMaterials = [...returnedMaterials];
      if (isPencabutan) {
        if (modemReturned.asset_id) {
          const m = assetsList.find(a => String(a.id) === String(modemReturned.asset_id));
          if (m) finalReturnedMaterials.push({ 
            asset_id: m.id, 
            name: m.name, 
            qty: 1, 
            unit: m.stock_type, 
            condition: modemReturned.condition,
            serial_number: modemReturned.serial_number || selectedTask.customer?.modem_sn || selectedTask.modem_sn || 'SN-TARIK',
            has_adaptor: modemReturned.has_adaptor !== false 
          });
        }
      } else if (isGangguan && isReplacingModem) {
        const defaultOnt = assetsList.find(a => String(a.id) === String(modemNewAssetId)) || assetsList[0];
        if (defaultOnt) {
          finalReturnedMaterials.push({
            asset_id: defaultOnt.id,
            name: defaultOnt.name + ' (Eks Gangguan)',
            qty: 1,
            unit: 'Unit',
            condition: 'Rusak',
            serial_number: modemOldSn,
            has_adaptor: modemOldHasAdaptor
          });
        }
      }

      let finalAdditionalMaterials = [...additionalMaterials];
      if (isGangguan && isReplacingModem && modemNewAssetId) {
        const newOnt = assetsList.find(a => String(a.id) === String(modemNewAssetId));
        if (newOnt) {
          finalAdditionalMaterials.push({
            asset_id: newOnt.id,
            name: newOnt.name,
            qty: 1,
            unit: 'Unit',
            serial_number: modemNewSn,
            stock_category: 'Baru'
          });
        }
      }

      // Collect ALL documentation photos across all categories
      const categoryLabels = {
        lokasi: 'Foto Rumah / Lokasi',
        ont: 'Foto Perangkat ONT / Redaman',
        kabel: 'Foto Tarikan Kabel FO',
        hasil: 'Foto Hasil Akhir / Speedtest',
        before: 'Foto Sebelum Perbaikan',
        after: 'Foto Sesudah Perbaikan',
        modem_ditarik: 'Foto Modem Cabutan',
        adaptor_ditarik: 'Foto Adaptor Cabutan'
      };

      const allDocPhotos = [];
      Object.entries(docPhotos).forEach(([catKey, photoList]) => {
        if (Array.isArray(photoList)) {
          photoList.forEach((p, idx) => {
            const photoUrl = typeof p === 'string' ? p : (p?.url || null);
            if (photoUrl) {
              let label = categoryLabels[catKey] || `Foto ${catKey.replace(/_/g, ' ').toUpperCase()}`;
              if (catKey.startsWith('ont_assign_')) {
                label = `Foto Perangkat Assign #${parseInt(catKey.replace('ont_assign_', '')) + 1}`;
              } else if (catKey.startsWith('ont_add_')) {
                label = `Foto Perangkat Tambahan #${parseInt(catKey.replace('ont_add_', '')) + 1}`;
              } else if (photoList.length > 1) {
                label += ` (${idx + 1})`;
              }

              allDocPhotos.push({
                category: catKey,
                label,
                url: photoUrl
              });
            }
          });
        }
      });

      const pemBaruProof = allDocPhotos.find(p => p.category.startsWith('ont_assign_') || p.category.startsWith('ont_add_'))?.url || allDocPhotos[0]?.url || null;
      const primaryProofPhoto = (isPencabutan ? docPhotos.modem_ditarik?.[0]?.url : (isGangguan ? docPhotos.after?.[0]?.url : pemBaruProof)) || allDocPhotos[0]?.url || null;

      completeTaskMutation.mutate({
        id: selectedTask.id,
        data: {
          modem_sn: (isGangguan && isReplacingModem) ? modemNewSn : (modemItem ? modemItem.sn : null),
          kabel_fo_used: kabelItem ? kabelItem.sn : null,
          technician_notes: notesPrefix + pemBaruPhotos + (catatan ? catatan + '\n\n' : '') + locationStr,
          odp_id: selectedOdpId || selectedTask.odp_id || null,
          odp_port: odpPort || null,
          redaman_dbm: redamanDbm || null,
          additional_materials: finalAdditionalMaterials,
          returned_materials: finalReturnedMaterials,
          latitude: lat || gpsCoords.latitude || null,
          longitude: lng || gpsCoords.longitude || null,
          proof_photo_url: primaryProofPhoto,
          documentation_photos: allDocPhotos,
          status: 'Selesai'
        }
      }, {
        onSuccess: () => {
          del(`assetPhotos_${selectedTask.id}`);
          del(`docPhotos_${selectedTask.id}`);
          del(`catatan_${selectedTask.id}`);
          del(`currentStep_${selectedTask.id}`);
          del(`rootCause_${selectedTask.id}`);
          del(`rootCauseOther_${selectedTask.id}`);

          if (selectedTask?.type === 'Pembangunan' || selectedTask?.type === 'Pembangunan Jaringan') {
            toast.success('🎉 Tugas Pembangunan Selesai! Mengarahkan ke Pemetaan ODP untuk Tambah Titik Baru...');
            setTimeout(() => {
              navigate('/teknisi/peta-odp?action=tambah_odp');
            }, 1200);
          }
        }
      });
    };

    // Prioritize exact GPS captured when the modem/device photo was captured/uploaded!
    const photoLat = gpsCoords.latitude;
    const photoLng = gpsCoords.longitude;

    if (photoLat && photoLng) {
      const locStr = `📍 Lokasi Presisi (dari Foto Modem): https://maps.google.com/?q=${photoLat},${photoLng}`;
      sendCompletion(locStr, photoLat, photoLng);
    } else if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setGpsCoords({ latitude, longitude });
          const locStr = `📍 Lokasi Selesai: https://maps.google.com/?q=${latitude},${longitude}`;
          sendCompletion(locStr, latitude, longitude);
        },
        (error) => {
          sendCompletion('📍 Lokasi Selesai: (Akses GPS ditolak/gagal)', null, null);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      sendCompletion('📍 Lokasi Selesai: (Perangkat tidak mendukung GPS)', null, null);
    }
  };

  const handleCloseTicket = () => {
    setSelectedTask(null);
    fetchTasks();
  };

  const fileToBase64 = (file, customMeta = {}) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // 1. Draw original photo
        ctx.drawImage(img, 0, 0, width, height);

        // 2. SGTNET Marki-style Translucent Overlay Banner at bottom
        const bannerHeight = Math.max(75, Math.round(height * 0.22));
        const bannerY = height - bannerHeight;

        // Dark translucent gradient background
        const gradient = ctx.createLinearGradient(0, bannerY, 0, height);
        gradient.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
        gradient.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, bannerY, width, bannerHeight);

        // Sky Blue Top Accent Line
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(0, bannerY, width, 3);

        // 3. SGTNET Badge (Top-left of banner)
        ctx.fillStyle = '#0284c7';
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(12, bannerY + 10, 115, 22, 5);
          ctx.fill();
        } else {
          ctx.fillRect(12, bannerY + 10, 115, 22);
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('SGTNET VERIFIED', 18, bannerY + 25);

        // Date & Time Timestamp (Yellow Marki style)
        const nowStr = customMeta.time || new Date().toLocaleString('id-ID', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }) + ' WIB';

        ctx.fillStyle = '#FCD34D';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`🕒 ${nowStr}`, 138, bannerY + 25);

        // Line 1: Technician & Ticket Info
        const techStr = customMeta.tech || selectedTask?.technician?.name || 'Rizky Fauzan (TK-01)';
        const ticketStr = customMeta.ticket || selectedTask?.ticket_number || selectedTask?.noPesanan || 'ORD-LAPANGAN';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '500 11px sans-serif';
        ctx.fillText(`👷 Teknisi: ${techStr}  |  🎫 Tiket: ${ticketStr}`, 14, bannerY + 46);

        // Line 2: GPS Location Coordinates
        const lat = customMeta.lat || gpsCoords?.latitude || '-6.46657';
        const lng = customMeta.lng || gpsCoords?.longitude || '107.83390';
        ctx.fillStyle = '#38BDF8';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`📍 GPS Presisi: ${lat}, ${lng} (SGTNET Marki Map Camera)`, 14, bannerY + 63);

        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => resolve(event.target.result);
    };
    reader.onerror = () => resolve('');
  });

  const handleAddAssetPhoto = async (idx, file) => {
    if (!file) return;
    const base64Url = await fileToBase64(file);
    const newObj = { file, url: base64Url || URL.createObjectURL(file) };
    setAssetPhotos(prev => {
      const next = { ...prev, [idx]: [...(prev[idx] || []), newObj] };
      const filesToSave = {};
      for(const k in next) filesToSave[k] = next[k].map(o => o.file);
      set(`assetPhotos_${selectedTask.id}`, filesToSave);
      return next;
    });
  };

  const handleAddDocPhoto = async (category, file) => {
    if (!file) return;
    const currentPhotos = docPhotos[category] || [];
    if (currentPhotos.length >= 5) {
      toast.error('Maksimal 5 foto per kategori.');
      return;
    }

    setUploadingState(prev => ({ ...prev, [category]: true }));

    if ((category.startsWith('ont') || category === 'before' || category === 'after') && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          toast.success(`📍 GPS terkunci: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }

    try {
      const base64Url = await fileToBase64(file);
      const newObj = {
        file,
        url: base64Url || URL.createObjectURL(file),
        name: file.name,
        isSaved: true
      };

      setDocPhotos(prev => {
        const next = { ...prev, [category]: [...(prev[category] || []), newObj] };
        const filesToSave = {};
        for (const cat in next) filesToSave[cat] = next[cat].map(o => o.file);
        if (selectedTask) set(`docPhotos_${selectedTask.id}`, filesToSave);
        return next;
      });

      toast.success('📸 Foto berhasil diunggah & tersimpan!');
    } catch (e) {
      console.error('Photo upload error:', e);
      toast.error('Gagal memproses foto.');
    } finally {
      setUploadingState(prev => ({ ...prev, [category]: false }));
    }
  };

  const handleRemoveDocPhoto = (category, index) => {
    setDocPhotos(prev => {
      const updated = [...(prev[category] || [])];
      updated.splice(index, 1);
      const next = { ...prev, [category]: updated };
      const filesToSave = {};
      for (const cat in next) filesToSave[cat] = next[cat].map(o => o.file);
      if (selectedTask) set(`docPhotos_${selectedTask.id}`, filesToSave);
      return next;
    });
    toast.success('Foto dihapus.');
  };

  const renderShopeePhotoGrid = (category, maxPhotos = 5) => {
    const currentPhotos = docPhotos[category] || [];
    const isUploading = !!uploadingState[category];

    return (
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginTop: '8px' }}>
        {currentPhotos.map((photoObj, i) => (
          <div
            key={i}
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '14px',
              position: 'relative',
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              overflow: 'hidden',
              backgroundColor: '#0f172a',
              flexShrink: 0,
              cursor: 'pointer'
            }}
            onClick={() => setLightboxUrl(photoObj?.url)}
          >
            <img
              src={photoObj?.url || ''}
              alt={`Foto ${i + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveDocPhoto(category, i);
              }}
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: '1.5px solid white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                zIndex: 10
              }}
              title="Hapus foto"
            >
              <X size={12} strokeWidth={3} />
            </button>

            <div style={{
              position: 'absolute',
              bottom: '4px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#059669',
              color: 'white',
              fontSize: '8px',
              fontWeight: 800,
              padding: '2px 5px',
              borderRadius: '99px',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              whiteSpace: 'nowrap',
              zIndex: 5
            }}>
              <CheckCircle2 size={9} /> Tersimpan
            </div>
          </div>
        ))}

        {isUploading && (
          <div style={{
            width: '84px',
            height: '84px',
            borderRadius: '14px',
            border: '2px dashed #0284c7',
            backgroundColor: '#f0f9ff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            color: '#0284c7',
            flexShrink: 0
          }}>
            <Loader2 size={20} className="animate-spin text-sky-600" />
            <span style={{ fontSize: '9px', fontWeight: 800 }}>Mengunggah</span>
          </div>
        )}

        {!isUploading && currentPhotos.length < maxPhotos && (
          <label
            htmlFor={`doc-upload-${category}`}
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '14px',
              border: '2px dashed #cbd5e1',
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            <input
              id={`doc-upload-${category}`}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleAddDocPhoto(category, e.target.files[0]);
                }
              }}
            />
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: '#e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '4px'
            }}>
              <Plus size={16} strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: '9.5px', fontWeight: 700, textAlign: 'center' }}>Tambah Foto</span>
            <span style={{ fontSize: '8.5px', opacity: 0.7 }}>({currentPhotos.length}/{maxPhotos})</span>
          </label>
        )}
      </div>
    );
  };

  const updateStep = (step) => {
    setCurrentStep(step);
    if (selectedTask) set(`currentStep_${selectedTask.id}`, step);
  };

  const updateCatatan = (val) => {
    setCatatan(val);
    if (selectedTask) set(`catatan_${selectedTask.id}`, val);
  };

  const updateRootCause = (val) => {
    setRootCause(val);
    if (selectedTask) set(`rootCause_${selectedTask.id}`, val);
  };

  const updateRootCauseOther = (val) => {
    setRootCauseOther(val);
    if (selectedTask) set(`rootCauseOther_${selectedTask.id}`, val);
  };

  if (selectedTask) {
    return (
      <div className="tk-main-content" style={{ paddingBottom: '140px' }}>
        
        {/* Detail Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <button 
            onClick={() => setSelectedTask(null)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #E2E8F0', padding: '10px 16px', borderRadius: '99px', cursor: 'pointer', fontWeight: 700, color: '#1E293B', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s ease' }}
          >
            <ArrowLeft size={18} /> Detail Tugas
          </button>
          <span style={{ backgroundColor: selectedTask.status === 'Selesai' ? '#ECFDF5' : '#FFFBEB', color: selectedTask.status === 'Selesai' ? '#047857' : '#D97706', border: selectedTask.status === 'Selesai' ? '1px solid #A7F3D0' : '1px solid #FDE68A', padding: '6px 14px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: selectedTask.status === 'Selesai' ? '#10B981' : '#F59E0B' }}></span>
            {selectedTask.status === 'Selesai' ? 'Selesai' : 'Diproses'}
          </span>
        </div>

        {/* Executive SaaS Workflow Stepper Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '0.85rem',
          borderRadius: '20px',
          border: '1px solid #E2E8F0',
          marginBottom: '1.25rem',
          boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          alignItems: 'center'
        }}>
          {[
            { step: 1, label: 'Dokumentasi', color: '#2563EB' },
            { step: 2, label: 'Aset & Teknis', color: '#2563EB' },
            { step: 3, label: 'Selesai', color: '#10B981' }
          ].map((item) => {
            const isActive = currentStep === item.step;
            const isPassed = currentStep > item.step;
            return (
              <button
                key={item.step}
                onClick={() => {
                  if (item.step === 3 && selectedTask.status !== 'Selesai') {
                    toast.info('Selesaikan langkah dokumentasi & kirim laporan untuk ke tahap Selesai');
                    return;
                  }
                  updateStep(item.step);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 4px',
                  borderRadius: '14px',
                  border: isActive ? `1.5px solid ${item.color}` : '1px solid #F1F5F9',
                  backgroundColor: isActive ? (item.step === 3 ? '#ECFDF5' : '#EFF6FF') : '#F8FAFC',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  outline: 'none'
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: isPassed ? '#10B981' : (isActive ? (item.step === 3 ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #42A1D3 0%, #2563EB 100%)') : '#E2E8F0'),
                  color: (isActive || isPassed) ? '#FFFFFF' : '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  boxShadow: isActive ? `0 3px 10px ${item.step === 3 ? 'rgba(16,185,129,0.35)' : 'rgba(37,99,235,0.35)'}` : 'none',
                  flexShrink: 0
                }}>
                  {isPassed ? <CheckCircle2 size={16} /> : item.step}
                </div>
                <span style={{
                  fontSize: '0.725rem',
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? (item.step === 3 ? '#047857' : '#1D4ED8') : '#64748B',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%'
                }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* INFO PELANGGAN */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '20px', border: '1px solid #E2E8F0', marginBottom: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>INFO PELANGGAN</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '1rem' }}>{selectedTask.name}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><MapPin size={16} color="#3B82F6" /></div>
                <span>{selectedTask.address}</span>
              </div>
              {(() => {
                const navLat = selectedTask.latitude || selectedTask.customer?.latitude;
                const navLng = selectedTask.longitude || selectedTask.customer?.longitude;
                const mapsUrl = (navLat && navLng) 
                  ? `https://www.google.com/maps/dir/?api=1&destination=${navLat},${navLng}`
                  : `https://maps.google.com/?q=${encodeURIComponent(String(selectedTask.address || ''))}`;
                const wazeUrl = (navLat && navLng)
                  ? `https://waze.com/ul?ll=${navLat},${navLng}&navigate=yes`
                  : `https://waze.com/ul?q=${encodeURIComponent(String(selectedTask.address || ''))}`;
                return (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <a 
                      href={mapsUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ 
                        textDecoration: 'none', 
                        backgroundColor: '#10B981', 
                        color: 'white', 
                        padding: '6px 12px', 
                        borderRadius: '8px', 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(16,185,129,0.3)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Navigation size={13} /> Maps
                    </a>
                    <a 
                      href={wazeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ 
                        textDecoration: 'none', 
                        backgroundColor: '#EFF6FF', 
                        color: '#1D4ED8', 
                        border: '1px solid #BFDBFE',
                        padding: '6px 12px', 
                        borderRadius: '8px', 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Navigation size={13} /> Waze
                    </a>
                  </div>
                );
              })()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Phone size={15} color="#2563EB" /></div>
                  <span>{selectedTask.phone}</span>
                </div>
                <a href={`https://wa.me/62${String(selectedTask.phone || '').replace(/^0+/, '').replace(/[^0-9]/g, '')}?text=Halo%20Bapak%2FIbu%20${encodeURIComponent(String(selectedTask.name || ''))},%20saya%20teknisi%20dari%20PT%20Sasikirana%20Global%20Teknologi%20(SGT%20NET)%20yang%20akan%20melakukan%20kunjungan...`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>Chat WA</a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Radio size={15} color="#2563EB" /></div>
                <span><strong>{selectedTask.odp}</strong></span>
              </div>
            </div>
          </div>

        {/* TIMELINE PROGRESS */}
        <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>PROGRESS WAKTU</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#475569' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB' }}></div>
                Ditugaskan
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#152C4A', fontFamily: 'monospace' }}>
                {selectedTask.created_at ? new Date(selectedTask.created_at).toLocaleString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}) : '-'}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#475569' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: selectedTask.started_at ? '#F59E0B' : (currentStep > 1 ? '#F59E0B' : '#CBD5E1') }}></div>
                Mulai Dikerjakan
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#152C4A', fontFamily: 'monospace' }}>
                {selectedTask.started_at ? new Date(selectedTask.started_at).toLocaleString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}) : (currentStep > 1 ? 'Sekarang' : '-')}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#475569' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: selectedTask.completed_at ? '#10B981' : '#CBD5E1' }}></div>
                Selesai
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#152C4A', fontFamily: 'monospace' }}>
                {selectedTask.completed_at ? new Date(selectedTask.completed_at).toLocaleString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}) : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Content: Ambil & Verifikasi Aset & Dokumentasi */}
        {currentStep < 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Content: Dokumentasi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.25rem' }}>
            {(selectedTask?.type === 'Pencabutan' ? [
              { id: 'lokasi', title: '1. Foto Rumah Pelanggan' }
            ] : (selectedTask?.type === 'Perbaikan Gangguan' || selectedTask?.type === 'Pemeliharaan' ? [
              { id: 'before', title: '1. Foto Before (Bukti Gangguan / LOS / OPM)' },
              { id: 'after', title: '2. Foto After (Bukti Normal / PON Hijau)' }
            ] : [
              { id: 'lokasi', title: '1. Foto Rumah Pelanggan' }
            ])).map(cat => (
              <div key={cat.id} style={{ backgroundColor: 'white', padding: '1rem 1.15rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <div style={{ fontWeight: 800, color: '#152C4A', fontSize: '0.85rem' }}>{cat.title}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>{(docPhotos?.[cat.id] || []).length}/5 foto</div>
                </div>
                {renderShopeePhotoGrid(cat.id, 5)}
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: 'white', padding: '1.15rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: selectedTask?.type === 'Pencabutan' ? '#B45309' : '#64748B', letterSpacing: '0.04em', marginBottom: '0.85rem' }}>
              {selectedTask?.type === 'Pencabutan' ? 'PENGEMBALIAN ASET (BARANG DITARIK)' : (selectedTask?.type === 'Perbaikan Gangguan' || selectedTask?.type === 'Pemeliharaan' ? 'ASET & MATERIAL TERPAKAI' : 'AMBIL & VERIFIKASI ASET')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selectedTask?.type === 'Pencabutan' ? (
                <>
                  {/* Status Banner Handover */}
                  <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <ShieldCheck size={16} color="#2563EB" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.75rem', color: '#1E40AF', lineHeight: 1.4 }}>
                      <strong>Alur Serah Terima Gudang:</strong> Barang yang Anda tarik dari rumah pelanggan akan tercatat berstatus <strong>Dipegang Teknisi</strong> sampai diserahterimakan ke Admin Gudang.
                    </div>
                  </div>

                  {/* Wajib: Modem ONT */}
                  <div style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#152C4A' }}>1. Detail Modem ONT yang Ditarik: *</div>
                    
                    <select
                      value={modemReturned.asset_id}
                      onChange={(e) => setModemReturned({ ...modemReturned, asset_id: e.target.value })}
                      style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontWeight: 700, fontSize: '0.75rem', outline: 'none', backgroundColor: 'white', color: '#152C4A' }}
                    >
                      <option value="">-- Pilih Tipe Modem --</option>
                      {(Array.isArray(assetsList) ? assetsList : []).filter(a => String(a.name||'').toLowerCase().includes('ont') || String(a.name||'').toLowerCase().includes('modem') || String(a.category||'').toLowerCase().includes('modem')).map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({a.brand || 'ZTE'})</option>
                      ))}
                    </select>

                    {/* Serial Number Input with Scan */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>Serial Number (SN) Modem Tarikan:</label>
                      <div style={{ display: 'flex', border: '1px solid #CBD5E1', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'white' }}>
                        <input 
                          type="text"
                          placeholder="Contoh: ZTE-F670L-SN-998811"
                          value={modemReturned.serial_number || ''}
                          onChange={(e) => setModemReturned({ ...modemReturned, serial_number: e.target.value })}
                          style={{ flex: 1, padding: '0.45rem 0.75rem', border: 'none', outline: 'none', fontSize: '0.78rem', fontFamily: 'monospace', fontWeight: 700, color: '#152C4A' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setActiveScanItem({ item: { name: 'Modem Tarikan' }, idx: -99 });
                            setIsScanning(true);
                          }}
                          style={{ backgroundColor: '#EFF6FF', color: '#2563EB', border: 'none', borderLeft: '1px solid #DBEAFE', padding: '0 0.65rem', fontWeight: 700, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                        >
                          <Camera size={13} />
                          <span>Scan</span>
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>Kondisi Fisik:</label>
                        <select
                          value={modemReturned.condition}
                          onChange={(e) => setModemReturned({ ...modemReturned, condition: e.target.value })}
                          style={{ width: '100%', padding: '0.45rem 0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontWeight: 700, fontSize: '0.75rem', outline: 'none', backgroundColor: modemReturned.condition === 'Rusak' ? '#FEE2E2' : '#DCFCE7', color: '#152C4A', marginTop: '2px' }}
                        >
                          <option value="Baik">Baik (Layak Pakai / RTS)</option>
                          <option value="Rusak">Rusak / Mati / Cacat</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', marginTop: '14px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#152C4A', cursor: 'pointer' }}>
                          <input 
                            type="checkbox"
                            checked={modemReturned.has_adaptor !== false}
                            onChange={(e) => setModemReturned({ ...modemReturned, has_adaptor: e.target.checked })}
                            style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                          />
                          Adaptor 12V Lengkap
                        </label>
                      </div>
                    </div>

                    <div style={{ marginTop: '4px' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Foto Bukti Fisik Modem Ditarik: *</div>
                      {renderShopeePhotoGrid('modem_ditarik', 3)}
                    </div>
                  </div>

                  {/* Returned Materials List for Additional Items */}
                  {(returnedMaterials || []).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Tambahan Barang Tarikan Lain:</div>
                      {(returnedMaterials || []).map((mat, i) => (
                        <div key={i} style={{ padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#152C4A' }}>{mat?.name || 'Aset'}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Masuk gudang: {mat?.qty || 1} {mat?.unit || 'Unit'} - Kondisi: {mat?.condition || 'Baik'}</div>
                          </div>
                          <button onClick={() => setReturnedMaterials((returnedMaterials || []).filter((_, idx) => idx !== i))} style={{ color: '#EF4444', border: 'none', background: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}>Batal</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {showReturnMat ? (
                    <div style={{ padding: '1rem', borderRadius: '12px', border: '1px dashed #CBD5E1', backgroundColor: 'white', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>Pilih Barang Tambahan Lain:</div>
                      <select
                        value={selectedAssetId}
                        onChange={(e) => setSelectedAssetId(e.target.value)}
                        style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontWeight: 600, fontSize: '0.75rem', outline: 'none' }}
                      >
                        <option value="">-- Pilih Jenis Aset --</option>
                        {(Array.isArray(assetsList) ? assetsList : []).map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                      <select
                        value={matCondition}
                        onChange={(e) => setMatCondition(e.target.value)}
                        style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontWeight: 600, fontSize: '0.75rem', outline: 'none' }}
                      >
                        <option value="Baik">Kondisi: Baik</option>
                        <option value="Rusak">Kondisi: Rusak</option>
                      </select>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="number"
                          placeholder="Qty"
                          value={matQty}
                          onChange={(e) => setMatQty(e.target.value)}
                          style={{ width: '70px', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontWeight: 700, fontSize: '0.75rem', outline: 'none' }}
                        />
                        <button
                          onClick={() => {
                            if (!selectedAssetId) return;
                            const asset = assetsList.find(a => String(a.id) === String(selectedAssetId));
                            if (asset) {
                              setReturnedMaterials([...returnedMaterials, { asset_id: asset.id, name: asset.name, qty: parseInt(matQty) || 1, unit: asset.stock_type, condition: matCondition }]);
                              setSelectedAssetId('');
                              setMatQty('1');
                              setMatCondition('Baik');
                              setShowReturnMat(false);
                              toast.success(`${asset.name} dicatat untuk dikembalikan ke gudang!`);
                            }
                          }}
                          className="sgt-btn-primary"
                          style={{ flex: 1, border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Catat Aset
                        </button>
                        <button onClick={() => setShowReturnMat(false)} style={{ backgroundColor: 'white', color: '#64748B', border: '1px solid #CBD5E1', padding: '0 12px', borderRadius: '8px', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>Batal</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowReturnMat(true)}
                      style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px dashed #CBD5E1', backgroundColor: '#F8FAFC', color: '#2563EB', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px' }}
                    >
                      <Plus size={14} /> <span>Tambahkan Barang Tarikan Lain</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  {/* DUAL SCAN FOR PERBAIKAN GANGGUAN / PEMELIHARAAN */}
                  {(selectedTask?.type === 'Perbaikan Gangguan' || selectedTask?.type === 'Pemeliharaan') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {/* Toggle Switch Replacement */}
                      <div 
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '12px',
                          border: isReplacingModem ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
                          backgroundColor: isReplacingModem ? '#EFF6FF' : '#F8FAFC',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer'
                        }} 
                        onClick={() => setIsReplacingModem(!isReplacingModem)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <RefreshCw size={16} color={isReplacingModem ? '#2563EB' : '#64748B'} />
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.8rem', color: isReplacingModem ? '#1E40AF' : '#152C4A' }}>
                              Ada Pergantian Modem ONT di Lokasi?
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                              {isReplacingModem ? 'Fitur Dual Scan Aktif (Scan Modem Lama & Modem Baru)' : 'Centang jika modem lama rusak & ditukar unit baru'}
                            </div>
                          </div>
                        </div>
                        <input 
                          type="checkbox"
                          checked={isReplacingModem}
                          onChange={(e) => setIsReplacingModem(e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563EB' }}
                        />
                      </div>

                      {isReplacingModem ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {/* BOX 1: MODEM LAMA / RUSAK */}
                          <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #FECACA', backgroundColor: '#FEF2F2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              1. SCAN / INPUT MODEM LAMA (DITARIK / RUSAK) *
                            </div>
                            
                            <div style={{ display: 'flex', border: '1px solid #FCA5A5', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'white' }}>
                              <input 
                                type="text"
                                placeholder="Scan / Ketik SN Modem Lama"
                                value={modemOldSn}
                                onChange={(e) => setModemOldSn(e.target.value)}
                                style={{ flex: 1, padding: '0.45rem 0.75rem', border: 'none', outline: 'none', fontSize: '0.78rem', fontFamily: 'monospace', fontWeight: 700, color: '#152C4A' }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveScanItem({ item: { name: 'Modem Lama' }, idx: -101 });
                                  setIsScanning(true);
                                }}
                                style={{ backgroundColor: '#FEE2E2', color: '#DC2626', border: 'none', borderLeft: '1px solid #FECACA', padding: '0 0.65rem', fontWeight: 700, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                              >
                                <Camera size={13} />
                                <span>Scan Lama</span>
                              </button>
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 700, color: '#991B1B', cursor: 'pointer' }}>
                              <input 
                                type="checkbox"
                                checked={modemOldHasAdaptor}
                                onChange={(e) => setModemOldHasAdaptor(e.target.checked)}
                                style={{ width: '14px', height: '14px', accentColor: '#DC2626' }}
                              />
                              Adaptor 12V Lama Lengkap Terbawa
                            </label>
                          </div>

                          {/* BOX 2: MODEM BARU PENGGANTI */}
                          <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', border: '1.5px solid #10B981', backgroundColor: '#F0FDF4', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              2. SCAN / INPUT MODEM BARU PENGGANTI *
                            </div>

                            <select
                              value={modemNewAssetId}
                              onChange={(e) => setModemNewAssetId(e.target.value)}
                              style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #A7F3D0', fontWeight: 700, fontSize: '0.75rem', outline: 'none', backgroundColor: 'white', color: '#152C4A' }}
                            >
                              <option value="">-- Pilih Tipe Modem dari Stok --</option>
                              {(Array.isArray(assetsList) ? assetsList : []).filter(a => String(a.name||'').toLowerCase().includes('ont') || String(a.name||'').toLowerCase().includes('modem') || String(a.category||'').toLowerCase().includes('modem')).map(a => (
                                <option key={a.id} value={a.id}>{a.name} (Baru: {a.available_stock}, Cabutan: {a.cabutan_stock || 0})</option>
                              ))}
                            </select>

                            <div style={{ display: 'flex', border: '1px solid #A7F3D0', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'white' }}>
                              <input 
                                type="text"
                                placeholder="Scan / Ketik SN Modem Baru"
                                value={modemNewSn}
                                onChange={(e) => setModemNewSn(e.target.value)}
                                style={{ flex: 1, padding: '0.45rem 0.75rem', border: 'none', outline: 'none', fontSize: '0.78rem', fontFamily: 'monospace', fontWeight: 700, color: '#152C4A' }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveScanItem({ item: { name: 'Modem Baru' }, idx: -102 });
                                  setIsScanning(true);
                                }}
                                style={{ backgroundColor: '#DCFCE7', color: '#059669', border: 'none', borderLeft: '1px solid #A7F3D0', padding: '0 0.65rem', fontWeight: 700, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                              >
                                <Camera size={13} />
                                <span>Scan Baru</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1', fontSize: '0.72rem', color: '#64748B' }}>
                          ℹ️ Tidak ada pergantian modem (hanya perbaikan jalur optik / redaman). Anda dapat menambahkan material sambungan (kabel/konektor) di bawah jika dibutuhkan.
                        </div>
                      )}
                    </div>
                  )}

                  {!(selectedTask?.type === 'Perbaikan Gangguan' || selectedTask?.type === 'Pemeliharaan') && (selectedTask?.items || []).map((item, idx) => {
                    const isKabel = String(item?.name || '').toLowerCase().includes('kabel');
                    const rawVal = String(item?.sn || '').replace(/[^0-9]/g, '');
                    return (
                      <div key={idx} style={{ padding: '0.85rem 1rem', borderRadius: '12px', border: item?.verified ? '1.5px solid #10B981' : '1px solid #E2E8F0', backgroundColor: item?.verified ? '#F0FDF4' : 'white', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxSizing: 'border-box', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                          <div style={{ fontWeight: 800, color: '#152C4A', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <PackageCheck size={14} color="#2563EB" />
                            </div>
                            <span>{item?.name || 'Aset'}</span>
                          </div>
                          {item?.verified && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669', fontSize: '0.7rem', fontWeight: 800, backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '99px' }}>
                              <CheckCircle2 size={12} /> Terverifikasi ({item?.sn})
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                            {isKabel ? 'Panjang Kabel Terpakai (Meter):' : 'Serial Number (SN) Modem / Perangkat:'}
                          </label>
                          <div style={{
                            display: 'flex',
                            alignItems: 'stretch',
                            border: item?.verified ? '1.5px solid #10B981' : '1px solid #CBD5E1',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: 'white',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}>
                            <input
                              type={isKabel ? "number" : "text"}
                              placeholder={isKabel ? 'Contoh: 150 (Meter)' : 'Contoh: ZTE-F670L-SN-998811'}
                              value={item?.sn || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                const formatted = isKabel ? (val ? `${val} Meter` : '') : val;
                                const updatedItems = (selectedTask?.items || []).map((it, i) => i === idx ? { ...it, sn: formatted, verified: false } : it);
                                setSelectedTask({ ...selectedTask, items: updatedItems });
                              }}
                              style={{
                                flex: 1,
                                minWidth: 0,
                                padding: '0.45rem 0.75rem',
                                border: 'none',
                                outline: 'none',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                color: '#152C4A',
                                fontFamily: 'monospace',
                                backgroundColor: 'transparent'
                              }}
                            />
                            {!isKabel && (
                              <button 
                                type="button"
                                onClick={() => {
                                  setActiveScanItem({ item, idx });
                                  setIsScanning(true);
                                }}
                                style={{
                                  backgroundColor: '#EFF6FF',
                                  color: '#2563EB',
                                  border: 'none',
                                  borderLeft: '1px solid #DBEAFE',
                                  padding: '0 0.65rem',
                                  fontWeight: 700,
                                  fontSize: '0.72rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0
                                }}
                              >
                                <Camera size={13} />
                                <span>Scan</span>
                              </button>
                            )}
                            <button 
                              type="button" 
                              onClick={() => {
                                const currentSn = item?.sn || '';
                                if (!currentSn.trim()) {
                                  toast.error(`Harap isi ${isKabel ? 'panjang kabel (meter)' : 'Serial Number (SN)'} terlebih dahulu!`);
                                  return;
                                }
                                processScan(item, idx, currentSn);
                              }}
                              style={{ 
                                backgroundColor: item?.verified ? '#059669' : '#2563EB', 
                                color: 'white', 
                                border: 'none', 
                                padding: '0 0.85rem',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}
                            >
                              {item?.verified ? <CheckCircle2 size={13} /> : <Save size={13} />}
                              <span>{item?.verified ? 'Tersimpan' : 'Simpan'}</span>
                            </button>
                          </div>
                        </div>

                        {!isKabel && (
                          <div style={{ marginTop: '2px', paddingTop: '8px', borderTop: '1px dashed #E2E8F0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
                                Upload Bukti Foto Perangkat Terpasang *
                              </span>
                              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#2563EB', backgroundColor: '#EFF6FF', padding: '1px 6px', borderRadius: '4px', border: '1px solid #DBEAFE' }}>
                                GPS Terkunci
                              </span>
                            </div>
                            {renderShopeePhotoGrid(`ont_assign_${idx}`, 3)}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Dynamic Materials List */}
                  {(additionalMaterials || []).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Aset Tambahan Terpakai:</div>
                      {(additionalMaterials || []).map((mat, i) => {
                        const isKabel = String(mat?.name || '').toLowerCase().includes('kabel');
                        return (
                          <div key={i} style={{ padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#152C4A' }}>{mat?.name || 'Aset'} <span style={{fontSize: '0.7rem', fontWeight: 600, color: mat?.stock_category === 'Cabutan' ? '#D97706' : '#059669'}}>({mat?.stock_category || 'Baru'})</span></div>
                                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Jumlah: {mat?.qty || 1} {mat?.unit || 'Unit'}</div>
                              </div>
                              <button onClick={() => setAdditionalMaterials((additionalMaterials || []).filter((_, idx) => idx !== i))} style={{ color: '#EF4444', border: 'none', background: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}>Hapus</button>
                            </div>
                            
                            {!isKabel && (
                              <div style={{ marginTop: '2px', paddingTop: '6px', borderTop: '1px dashed #CBD5E1' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2563EB', marginBottom: '4px' }}>Foto Perangkat Terpasang (GPS): *</div>
                                {renderShopeePhotoGrid(`ont_add_${i}`, 3)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {showAddMat ? (
                    <div style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #BFDBFE', backgroundColor: '#EFF6FF', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#152C4A' }}>Pilih Aset / Material Terpakai dari Stok:</div>
                      <select
                        value={selectedAssetId}
                        onChange={(e) => setSelectedAssetId(e.target.value)}
                        style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #BFDBFE', fontWeight: 600, fontSize: '0.75rem', outline: 'none' }}
                      >
                        <option value="">-- Pilih Aset / Consumable --</option>
                        {(Array.isArray(assetsList) ? assetsList : []).map(a => (
                          <option key={a.id} value={a.id}>{a.name} (Baru: {a.available_stock}, Cabutan: {a.cabutan_stock || 0})</option>
                        ))}
                      </select>
                      {selectedAssetId && (
                        <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                            <input type="radio" name="matStockCategory" value="Baru" checked={matStockCategory === 'Baru'} onChange={() => setMatStockCategory('Baru')} style={{ width: '14px', height: '14px', accentColor: '#059669' }} />
                            Stok Baru
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                            <input type="radio" name="matStockCategory" value="Cabutan" checked={matStockCategory === 'Cabutan'} onChange={() => setMatStockCategory('Cabutan')} style={{ width: '14px', height: '14px', accentColor: '#D97706' }} />
                            Stok Cabutan
                          </label>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="number"
                          placeholder="Qty"
                          value={matQty}
                          onChange={(e) => setMatQty(e.target.value)}
                          style={{ width: '70px', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #BFDBFE', fontWeight: 700, fontSize: '0.75rem', outline: 'none' }}
                        />
                        <button
                          onClick={() => {
                            if (!selectedAssetId) return;
                            const asset = assetsList.find(a => String(a.id) === String(selectedAssetId));
                            if (asset) {
                              setAdditionalMaterials([...additionalMaterials, { asset_id: asset.id, name: asset.name, qty: parseInt(matQty) || 1, unit: asset.stock_type, stock_category: matStockCategory }]);
                              setSelectedAssetId('');
                              setMatQty('1');
                              setMatStockCategory('Baru');
                              setShowAddMat(false);
                              toast.success(`${asset.name} (${matStockCategory}) berhasil ditambahkan!`);
                            }
                          }}
                          className="sgt-btn-primary"
                          style={{ flex: 1, border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Tambahkan Aset
                        </button>
                        <button onClick={() => setShowAddMat(false)} style={{ backgroundColor: 'white', color: '#64748B', border: '1px solid #CBD5E1', padding: '0 12px', borderRadius: '8px', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>Batal</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddMat(true)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 1rem',
                        borderRadius: '8px',
                        border: '1px dashed #CBD5E1',
                        backgroundColor: '#F8FAFC',
                        color: '#2563EB',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        marginTop: '6px'
                      }}
                    >
                      <Plus size={14} /> <span>Tambahkan Aset / Material Terpakai</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Content: Teknis & ODP */}
          {selectedTask?.type !== 'Pencabutan' && (
            <div style={{ backgroundColor: 'white', padding: '1.15rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.04em', marginBottom: '0.85rem' }}>DATA TEKNIS & ODP</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(selectedTask?.type === 'Perbaikan Gangguan' || selectedTask?.type === 'Pemeliharaan') && (
                <div style={{ padding: '0.85rem', backgroundColor: '#FEF2F2', borderRadius: '12px', border: '1px solid #FECACA', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#991B1B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    DIAGNOSA PENYEBAB GANGGUAN (ROOT CAUSE) <span style={{color: '#EF4444'}}>*</span>
                  </label>
                  <select
                    value={rootCause}
                    onChange={(e) => updateRootCause(e.target.value)}
                    style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #FCA5A5', backgroundColor: 'white', fontWeight: 600, fontSize: '0.75rem', color: '#152C4A', outline: 'none' }}
                  >
                    <option value="">-- Pilih Penyebab Gangguan --</option>
                    <option value="Kabel Drop Core FO Putus / Terlipat">Kabel Drop Core FO Putus / Terlipat</option>
                    <option value="Konektor Fast Connector Kotor / Renggang / Patah">Konektor Fast Connector Kotor / Renggang / Patah</option>
                    <option value="Modem ONT Hang / Error / Rusak">Modem ONT Hang / Error / Rusak</option>
                    <option value="Adaptor Power Supply Mati">Adaptor Power Supply Mati</option>
                    <option value="Gangguan dari Tiang / ODP / OLT">Gangguan dari Tiang / ODP / OLT</option>
                    <option value="Lainnya">Lainnya (Tulis Manual)</option>
                  </select>
                  {rootCause === 'Lainnya' && (
                    <input
                      type="text"
                      placeholder="Tuliskan penyebab gangguan secara spesifik..."
                      value={rootCauseOther}
                      onChange={(e) => updateRootCauseOther(e.target.value)}
                      style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #FCA5A5', backgroundColor: 'white', fontWeight: 500, fontSize: '0.75rem', outline: 'none', marginTop: '4px' }}
                    />
                  )}

                  {/* Validasi Standar BAB IV: Pengecekan Kebutuhan Ganti Barang */}
                  <div style={{ marginTop: '8px', padding: '0.75rem', backgroundColor: '#EFF6FF', borderRadius: '10px', border: '1px solid #BFDBFE' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox"
                        checked={needsReplacement}
                        onChange={(e) => setNeedsReplacement(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#2563EB', cursor: 'pointer' }}
                      />
                      <span>Membutuhkan Pergantian Barang / Sparepart?</span>
                    </label>
                    {needsReplacement && (
                      <div style={{ marginTop: '8px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1E3A8A', display: 'block', marginBottom: '4px' }}>
                          Rincian Suku Cadang yang Diperlukan (Eskalasi Admin):
                        </label>
                        <input 
                          type="text"
                          placeholder="Contoh: Butuh 1 Unit Modem ONT ZTE F670L + Patchcord..."
                          value={replacementNotes}
                          onChange={(e) => setReplacementNotes(e.target.value)}
                          style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #93C5FD', backgroundColor: 'white', fontWeight: 500, fontSize: '0.75rem', outline: 'none' }}
                        />
                        <div style={{ fontSize: '0.65rem', color: '#3B82F6', marginTop: '4px', fontWeight: 600 }}>
                          ℹ️ Status tugas akan dialihkan ke "Menunggu Persetujuan Admin" untuk alokasi logistik.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {selectedTask?.type === 'Pemasangan Baru' || showOdpMigration ? (
                <>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Pilih ODP Terpakai</label>
                    <select
                      value={selectedOdpId || selectedTask.odp_id || ''}
                      onChange={(e) => setSelectedOdpId(e.target.value)}
                      style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', fontWeight: 600, fontSize: '0.75rem', color: '#152C4A' }}
                    >
                      <option value="">-- Pilih ODP Terdekat --</option>
                      {(Array.isArray(odpList) ? odpList : []).map(o => (
                        <option key={o.id} value={o.id}>{o.name} - {o.dusun} ({o.used_ports}/{o.total_ports} port)</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>Nomor Port ODP</span>
                        {isLoadingPorts && <span style={{ color: '#2563EB', fontSize: '0.65rem' }}>Memuat...</span>}
                      </label>
                      <select
                        value={odpPort}
                        onChange={(e) => setOdpPort(e.target.value)}
                        style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', fontWeight: 600, fontSize: '0.75rem', outline: 'none', color: '#152C4A' }}
                      >
                        <option value="">-- Pilih Port --</option>
                        {odpPorts.map(p => (
                          <option key={p.port_number} value={p.port_number} disabled={p.is_used}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Redaman Optik (dBm)</label>
                      <input
                        type="text"
                        placeholder="Contoh: -19.5"
                        value={redamanDbm}
                        onChange={(e) => setRedamanDbm(e.target.value)}
                        style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', fontWeight: 600, fontSize: '0.75rem', fontFamily: 'monospace', color: '#152C4A', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setShowOdpMigration(true)}
                  style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px dashed #CBD5E1', backgroundColor: '#F8FAFC', color: '#2563EB', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <RefreshCw size={13} /> <span>Migrasi Port / Tiang ODP</span>
                </button>
              )}
            </div>
          </div>
          )}

          {/* Content: Catatan & Kirim */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ backgroundColor: 'white', padding: '1rem 1.15rem', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ fontWeight: 800, color: '#152C4A', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Catatan Lapangan</div>
              <textarea 
                value={catatan}
                onChange={(e) => updateCatatan(e.target.value)}
                placeholder="Catatan tambahan untuk tim admin (opsional)..."
                style={{ width: '100%', minHeight: '80px', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.75rem', boxSizing: 'border-box', color: '#152C4A' }}
              />
            </div>

            <button 
              onClick={handleCompleteTask}
              className={needsReplacement ? "" : "sgt-btn-primary"}
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: needsReplacement ? '#EA580C' : undefined,
                color: 'white',
                boxShadow: needsReplacement ? '0 4px 12px rgba(234, 88, 12, 0.3)' : '0 4px 12px rgba(37, 99, 235, 0.25)'
              }}
            >
              {needsReplacement ? <AlertTriangle size={18} /> : <Check size={16} />}
              <span>
                {needsReplacement 
                  ? 'Kirim Eskalasi ke Admin (Butuh Suku Cadang)' 
                  : (selectedTask?.type === 'Perbaikan Gangguan' 
                      ? 'Kirim Laporan Perbaikan Gangguan' 
                      : (selectedTask?.type === 'Pemeliharaan' 
                          ? 'Kirim Laporan Pemeliharaan' 
                          : (selectedTask?.type === 'Pencabutan' 
                              ? 'Kirim Laporan Pencabutan' 
                              : (selectedTask?.type === 'Pembangunan' ? 'Selesai & Tambah Titik ODP' : 'Kirim Laporan Pemasangan'))))}
              </span>
            </button>
          </div>
          </div>
        )}

        {/* Step 3 Content: Selesai */}
        {currentStep === 3 && (
          <div style={{ backgroundColor: 'white', padding: '2rem 1.5rem', borderRadius: '20px', border: '1px solid #E2E8F0', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#ECFDF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <ShieldCheck size={48} color="#10B981" />
            </div>
            <p style={{ color: '#64748B', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.5' }}>
              Terima kasih, tugas ini telah berhasil diselesaikan dan laporan telah dikirim ke sistem.
            </p>
            <button 
              onClick={handleCloseTicket}
              style={{ width: '100%', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', border: 'none', padding: '16px', borderRadius: '14px', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)' }}
            >
              Kembali ke Daftar Tugas
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="tk-main-content" style={{ paddingBottom: '120px' }}>
      
      {/* Minimalist Executive Realtime Sync Toast */}
      {realtimeAlert && (
        <div style={{ 
          position: 'fixed', 
          top: '16px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          color: '#0F172A', 
          padding: '6px 14px 6px 10px', 
          borderRadius: '99px', 
          fontSize: '0.78rem', 
          fontWeight: 600, 
          zIndex: 9999, 
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(37, 99, 235, 0.06)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px'
        }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#EFF6FF', border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <RefreshCw size={12} color="#2563EB" className="animate-spin" />
          </div>
          <span style={{ color: '#334155', letterSpacing: '-0.01em' }}>
            {realtimeAlert.replace(/^🔔\s*/, '')}
          </span>
        </div>
      )}

      {/* Executive Field Operations Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #F1F7FC 0%, #FFFFFF 100%)',
        border: '1px solid #E2EBF4',
        borderRadius: '14px',
        padding: '1rem 1.15rem',
        marginBottom: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#152C4A', margin: 0, letterSpacing: '-0.02em' }}>
              Tugas &amp; Operasional Lapangan
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '3px 0 0 0', fontWeight: 500, lineHeight: 1.4 }}>
              Kelola tiket pemasangan baru, perbaikan gangguan jaringan, konfirmasi ODP, dan pelaporan material.
            </p>
          </div>
          <button 
            onClick={() => {
              setRealtimeAlert('Menyingkronkan tugas realtime...');
              fetchTasks();
              setTimeout(() => setRealtimeAlert(null), 2500);
            }}
            style={{ background: 'white', border: '1px solid #CBD5E1', padding: '5px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#152C4A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
          >
            <RefreshCw size={13} className={realtimeAlert ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* 4 KPI Metric Cards (2x2 Grid) */}
      <div className="tk-stats-container">
        {/* Card 1: TOTAL TUGAS */}
        <div 
          className={`tk-stat-card ${activeTab === 'Semua' ? 'active-card-total' : ''}`}
          onClick={() => setActiveTab('Semua')}
          title="Filter Semua Tugas"
        >
          <div className="tk-stat-card-top">
            <span className="tk-stat-card-title">TOTAL TUGAS</span>
            <div className="tk-stat-circle-icon icon-blue">
              <Users size={14} color="#2563EB" />
            </div>
          </div>
          <div>
            <div className="tk-stat-main-num">{taskList.length}</div>
            <div className="tk-stat-card-sub">Semua Tiket Hari Ini</div>
          </div>
        </div>

        {/* Card 2: PENDING */}
        <div 
          className={`tk-stat-card ${activeTab === 'Pending' ? 'active-card-pending' : ''}`}
          onClick={() => setActiveTab('Pending')}
          title="Filter Tugas Pending"
        >
          <div className="tk-stat-card-top">
            <span className="tk-stat-card-title" style={{ color: '#D97706' }}>PENDING</span>
            <div className="tk-stat-circle-icon icon-orange">
              <Clock size={14} color="#D97706" />
            </div>
          </div>
          <div>
            <div className="tk-stat-main-num" style={{ color: '#D97706' }}>{taskList.filter(t => t.status === 'Pending').length}</div>
            <div className="tk-stat-card-sub">Menunggu Eksekusi</div>
          </div>
        </div>

        {/* Card 3: DIPROSES */}
        <div 
          className={`tk-stat-card ${activeTab === 'Progress' ? 'active-card-process' : ''}`}
          onClick={() => setActiveTab('Progress')}
          title="Filter Tugas Diproses"
        >
          <div className="tk-stat-card-top">
            <span className="tk-stat-card-title" style={{ color: '#2563EB' }}>DIPROSES</span>
            <div className="tk-stat-circle-icon icon-process">
              <RefreshCw size={14} color="#2563EB" />
            </div>
          </div>
          <div>
            <div className="tk-stat-main-num" style={{ color: '#2563EB' }}>{taskList.filter(t => t.status === 'Progress').length}</div>
            <div className="tk-stat-card-sub">Pengerjaan Lapangan</div>
          </div>
        </div>

        {/* Card 4: SELESAI */}
        <div 
          className={`tk-stat-card ${activeTab === 'Selesai' ? 'active-card-done' : ''}`}
          onClick={() => setActiveTab('Selesai')}
          title="Filter Tugas Selesai"
        >
          <div className="tk-stat-card-top">
            <span className="tk-stat-card-title" style={{ color: '#059669' }}>SELESAI</span>
            <div className="tk-stat-circle-icon icon-green">
              <CheckCircle2 size={14} color="#059669" />
            </div>
          </div>
          <div>
            <div className="tk-stat-main-num" style={{ color: '#059669' }}>{taskList.filter(t => t.status === 'Selesai').length}</div>
            <div className="tk-stat-card-sub">Berhasil Dikerjakan</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs with Counters */}
      <div className="tk-filter-scroll">
        {[
          { key: 'Semua', count: taskList.length },
          { key: 'Pending', count: taskList.filter(t => t.status === 'Pending').length },
          { key: 'Progress', count: taskList.filter(t => t.status === 'Progress').length },
          { key: 'Selesai', count: taskList.filter(t => t.status === 'Selesai').length }
        ].map(tab => (
          <button 
            key={tab.key} 
            className={`tk-filter-pill ${activeTab === tab.key ? 'active' : 'inactive'}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.key} <span style={{ opacity: 0.85, fontSize: '0.75rem', fontWeight: 800, marginLeft: '4px' }}>({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Task List Cards */}
      <div>
        {filteredTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', backgroundColor: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '44px', height: '44px', backgroundColor: '#ECFDF5', color: '#059669', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.25rem' }}>
              <ShieldCheck size={24} color="#059669" />
            </div>
            <p style={{ fontWeight: 800, fontSize: '0.9rem', color: '#059669', margin: 0 }}>Semua Tugas Tuntas</p>
            <p style={{ fontSize: '0.725rem', color: '#64748B', margin: 0, maxWidth: '240px', lineHeight: 1.4 }}>Seluruh pekerjaan operasional lapangan telah selesai dikerjakan.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} className="tk-task-card" onClick={() => handleViewTask(task)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="tk-task-type-badge" style={{ backgroundColor: task.typeBg, color: task.typeColor }}>
                  {task.type}
                </span>
                <span className="tk-task-status-badge" style={{
                  backgroundColor: task.status === 'Selesai' ? '#D1FAE5' : (task.status === 'Progress' ? '#FEF3C7' : '#F1F5F9'),
                  color: task.status === 'Selesai' ? '#047857' : (task.status === 'Progress' ? '#B45309' : '#64748B')
                }}>
                  ● {task.status}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #152C4A 0%, #2563EB 100%)', color: 'white', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(37,99,235,0.25)' }}>
                  {task.name ? task.name.substring(0, 2).toUpperCase() : 'TK'}
                </div>
                <div>
                  <div className="tk-task-title" style={{ margin: 0 }}>{task.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                    Alokasi ODP: <span style={{ color: '#2563EB', fontWeight: 800 }}>{task.odp_name || 'ODP-SLG-01 Port 3'}</span>
                  </div>
                </div>
              </div>
              
              <div className="tk-task-info-row">
                <MapPin size={16} color="#3B82F6" /> <span style={{ fontWeight: 600, color: '#334155' }}>{task.address}</span>
              </div>
              <div className="tk-task-info-row" style={{ gap: '1rem', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', fontSize: '0.775rem' }}>
                  <Clock size={15} /> {task.date}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', fontSize: '0.775rem' }}>
                  <User size={15} /> {task.technician}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', marginTop: '0.65rem' }}>
                <a
                  href={(task.latitude && task.longitude) ? `https://www.google.com/maps/dir/?api=1&destination=${task.latitude},${task.longitude}` : `https://maps.google.com/?q=${encodeURIComponent(String(task.address || ''))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    flex: '0 0 auto',
                    textDecoration: 'none',
                    backgroundColor: '#ECFDF5',
                    color: '#059669',
                    border: '1px solid #A7F3D0',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Navigation size={12} /> Rute Maps
                </a>

                {task.status !== 'Selesai' && (
                  <button 
                    className="tk-btn-start"
                    onClick={(e) => handleStartTask(task, e)}
                    style={{
                      flex: 1,
                      margin: 0,
                      ...(task.status === 'Progress' ? { background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)' } : {})
                    }}
                  >
                    {task.status === 'Progress' ? 'Lanjutkan Tugas →' : 'Mulai Tugas →'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isScanning && (
        <BarcodeScanner 
          title="📷 Arahkan ke Barcode / QR"
          onScan={(decodedText) => {
            setIsScanning(false);
            if (activeScanItem?.idx === -99) {
              setModemReturned(prev => ({ ...prev, serial_number: decodedText }));
              toast.success(`SN Modem Ditarik: ${decodedText}`);
            } else if (activeScanItem?.idx === -101) {
              setModemOldSn(decodedText);
              toast.success(`SN Modem Lama: ${decodedText}`);
            } else if (activeScanItem?.idx === -102) {
              setModemNewSn(decodedText);
              toast.success(`SN Modem Baru: ${decodedText}`);
            } else if (activeScanItem?.item) {
              processScan(activeScanItem.item, activeScanItem.idx, decodedText);
            }
          }}
          onClose={() => setIsScanning(false)}
          onManual={(manualSn) => {
            setIsScanning(false);
            if (activeScanItem?.idx === -99) {
              setModemReturned(prev => ({ ...prev, serial_number: manualSn }));
              toast.success(`SN Modem Ditarik: ${manualSn}`);
            } else if (activeScanItem?.idx === -101) {
              setModemOldSn(manualSn);
              toast.success(`SN Modem Lama: ${manualSn}`);
            } else if (activeScanItem?.idx === -102) {
              setModemNewSn(manualSn);
              toast.success(`SN Modem Baru: ${manualSn}`);
            } else if (activeScanItem?.item) {
              processScan(activeScanItem.item, activeScanItem.idx, manualSn);
            }
          }}
        />
      )}

      {/* Lightbox Full Resolution Image Viewer */}
      {lightboxUrl && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.9)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            backdropFilter: 'blur(8px)'
          }}
          onClick={() => setLightboxUrl(null)}
        >
          <div style={{ position: 'relative', maxWidth: '92vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <img 
              src={lightboxUrl} 
              alt="Preview Foto Lapangan" 
              style={{ width: '100%', height: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} 
            />
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              style={{
                position: 'absolute', top: '-14px', right: '-14px',
                backgroundColor: '#ef4444', color: 'white', border: '2px solid white',
                borderRadius: '50%', width: '34px', height: '34px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                zIndex: 10
              }}
            >
              <X size={18} strokeWidth={3} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
