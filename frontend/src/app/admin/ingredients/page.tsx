'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { AlertTriangle, ArrowDownToLine, Beaker, CheckCircle2, PackagePlus, Plus, RefreshCw, Search, Settings2, X } from 'lucide-react';
import api from '@/lib/api';

type IngredientUnit = 'G' | 'ML' | 'PIECE';
type DecimalValue = string | number | null;

interface Ingredient {
  id: string;
  code: string;
  name: string;
  unit: IngredientUnit;
  trackStock: boolean;
  onHand: DecimalValue;
  reserved: DecimalValue;
  packageQuantity: DecimalValue;
  lowStockThreshold: DecimalValue;
  version: number;
  isActive: boolean;
}

type StockFilter = 'all' | 'low' | 'untracked' | 'inactive';
type CreateForm = {
  code: string;
  name: string;
  unit: IngredientUnit;
  trackStock: boolean;
  onHand: string;
  packageQuantity: string;
  lowStockThreshold: string;
  isActive: boolean;
};

const EMPTY_CREATE_FORM: CreateForm = {
  code: '', name: '', unit: 'G', trackStock: true, onHand: '0', packageQuantity: '', lowStockThreshold: '', isActive: true,
};

const UNIT_LABEL: Record<IngredientUnit, string> = { G: 'g', ML: 'ml', PIECE: 'cái' };
const INPUT_CLASS = 'mt-1 w-full rounded-xl border border-primary/20 bg-white px-3 py-2.5 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10';

function amount(value: DecimalValue): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatAmount(value: number | null, unit: IngredientUnit): string {
  if (value === null) return '—';
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(value)} ${UNIT_LABEL[unit]}`;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404 || error.response?.status === 405) {
      return 'Chức năng quản lý nguyên liệu chưa sẵn sàng. Vui lòng thử lại sau.';
    }
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
    if (!error.response) return 'Không kết nối được máy chủ. Vui lòng thử lại sau.';
  }
  return 'Không thực hiện được thao tác. Vui lòng thử lại.';
}

// Hợp đồng frontend dự kiến: GET/POST /admin/ingredients, PATCH /admin/ingredients/:id,
// POST /admin/ingredients/:id/restock với quantity tính bằng đơn vị gốc (g, ml hoặc cái).
async function fetchIngredients(): Promise<Ingredient[]> {
  const response = await api.get<{ data: Ingredient[] }>('/admin/ingredients');
  if (!Array.isArray(response.data.data)) throw new Error('Dữ liệu nguyên liệu không đúng định dạng.');
  return response.data.data;
}

export default function AdminIngredientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StockFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [restockAmount, setRestockAmount] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [packageQuantity, setPackageQuantity] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE_FORM);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const { data: ingredients = [], isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-ingredients'],
    queryFn: fetchIngredients,
    retry: 1,
  });

  const selected = ingredients.find((ingredient) => ingredient.id === selectedId) ?? null;

  function selectIngredient(ingredient: Ingredient) {
    setSelectedId(ingredient.id);
    setName(ingredient.name);
    setPackageQuantity(ingredient.packageQuantity === null ? '' : String(ingredient.packageQuantity));
    setLowStockThreshold(ingredient.lowStockThreshold === null ? '' : String(ingredient.lowStockThreshold));
    setIsActive(ingredient.isActive);
    setRestockAmount('');
    setFormError(null);
    setSuccess(null);
  }

  const visibleIngredients = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi-VN');
    return ingredients.filter((ingredient) => {
      const available = ingredient.trackStock ? (amount(ingredient.onHand) ?? 0) - (amount(ingredient.reserved) ?? 0) : null;
      const low = available !== null && available <= (amount(ingredient.lowStockThreshold) ?? 0);
      if (keyword && !`${ingredient.name} ${ingredient.code}`.toLocaleLowerCase('vi-VN').includes(keyword)) return false;
      if (filter === 'low' && !low) return false;
      if (filter === 'untracked' && ingredient.trackStock) return false;
      if (filter === 'inactive' && ingredient.isActive) return false;
      return true;
    });
  }, [ingredients, search, filter]);

  const lowCount = ingredients.filter((ingredient) => ingredient.trackStock &&
    (amount(ingredient.onHand) ?? 0) - (amount(ingredient.reserved) ?? 0) <= (amount(ingredient.lowStockThreshold) ?? 0)).length;
  const trackedCount = ingredients.filter((ingredient) => ingredient.trackStock).length;

  const restockMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) =>
      api.post(`/admin/ingredients/${id}/restock`, { quantity }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-ingredients'] });
      setRestockAmount('');
      setFormError(null);
      setSuccess('Đã cập nhật số lượng nguyên liệu.');
    },
    onError: (mutationError) => { setFormError(getErrorMessage(mutationError)); setSuccess(null); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { name: string; packageQuantity: number | null; lowStockThreshold: number | null; isActive: boolean } }) =>
      api.patch(`/admin/ingredients/${id}`, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-ingredients'] });
      setFormError(null);
      setSuccess('Đã lưu thông tin nguyên liệu.');
    },
    onError: (mutationError) => { setFormError(getErrorMessage(mutationError)); setSuccess(null); },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      code: string; name: string; unit: IngredientUnit; trackStock: boolean;
      onHand: number | null; packageQuantity: number | null; lowStockThreshold: number | null; isActive: boolean;
    }) => api.post('/admin/ingredients', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-ingredients'] });
      setCreateForm(EMPTY_CREATE_FORM);
      setCreateError(null);
      setCreateSuccess('Đã tạo nguyên liệu mới.');
      setShowCreate(false);
    },
    onError: (mutationError) => setCreateError(getErrorMessage(mutationError)),
  });

  function setCreateField<K extends keyof CreateForm>(key: K, value: CreateForm[K]) {
    setCreateForm((current) => ({ ...current, [key]: value }));
    setCreateError(null);
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = createForm.code.trim().toUpperCase();
    const name = createForm.name.trim();
    if (!/^[A-Z0-9_]{2,40}$/.test(code)) return setCreateError('Mã nguyên liệu cần 2–40 ký tự, chỉ gồm chữ không dấu, số và dấu gạch dưới.');
    if (!name) return setCreateError('Vui lòng nhập tên nguyên liệu.');

    const onHand = createForm.trackStock ? Number(createForm.onHand) : null;
    const packageQuantity = createForm.packageQuantity.trim() ? Number(createForm.packageQuantity) : null;
    const lowStockThreshold = createForm.trackStock && createForm.lowStockThreshold.trim()
      ? Number(createForm.lowStockThreshold) : null;
    const hasValidPrecision = (value: number) => Math.abs(value * 1000 - Math.round(value * 1000)) <= 0.000001;
    const validNumber = (value: number | null, allowZero: boolean) => value === null ||
      (Number.isFinite(value) && (allowZero ? value >= 0 : value > 0) && hasValidPrecision(value) &&
        (createForm.unit !== 'PIECE' || Number.isInteger(value)));

    if (createForm.trackStock && (createForm.onHand.trim() === '' || !validNumber(onHand, true))) {
      return setCreateError('Tồn ban đầu phải là số không âm hợp lệ theo đơn vị đã chọn.');
    }
    if (!validNumber(packageQuantity, false)) return setCreateError('Quy cách nhập phải là số dương hợp lệ.');
    if (!validNumber(lowStockThreshold, true)) return setCreateError('Ngưỡng cảnh báo phải là số không âm hợp lệ.');

    setCreateError(null);
    setCreateSuccess(null);
    createMutation.mutate({ code, name, unit: createForm.unit, trackStock: createForm.trackStock,
      onHand, packageQuantity, lowStockThreshold, isActive: createForm.isActive });
  }

  function handleRestock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !selected.trackStock) return;
    const quantity = Number(restockAmount);
    if (!Number.isFinite(quantity) || quantity <= 0 || Math.abs(quantity * 1000 - Math.round(quantity * 1000)) > 0.000001 ||
        (selected.unit === 'PIECE' && !Number.isInteger(quantity))) {
      setFormError(selected.unit === 'PIECE'
        ? 'Số cái nhập thêm phải là số nguyên dương.'
        : 'Số lượng nhập thêm phải lớn hơn 0 và có tối đa 3 chữ số thập phân.');
      return;
    }
    setFormError(null);
    setSuccess(null);
    restockMutation.mutate({ id: selected.id, quantity });
  }

  function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const packageValue = packageQuantity.trim() ? Number(packageQuantity) : null;
    const thresholdValue = lowStockThreshold.trim() ? Number(lowStockThreshold) : null;
    if (!name.trim()) return setFormError('Tên nguyên liệu không được để trống.');
    if (packageValue !== null && (!Number.isFinite(packageValue) || packageValue <= 0 || (selected.unit === 'PIECE' && !Number.isInteger(packageValue)))) {
      return setFormError('Quy cách nhập phải là số dương hợp lệ.');
    }
    if (thresholdValue !== null && (!Number.isFinite(thresholdValue) || thresholdValue < 0 || (selected.unit === 'PIECE' && !Number.isInteger(thresholdValue)))) {
      return setFormError('Ngưỡng cảnh báo phải là số không âm hợp lệ.');
    }
    setFormError(null);
    setSuccess(null);
    updateMutation.mutate({ id: selected.id, payload: { name: name.trim(), packageQuantity: packageValue, lowStockThreshold: thresholdValue, isActive } });
  }

  const selectedPackage = selected ? amount(selected.packageQuantity) : null;
  const selectedAvailable = selected?.trackStock ? (amount(selected.onHand) ?? 0) - (amount(selected.reserved) ?? 0) : null;
  const loadingMutation = restockMutation.isPending || updateMutation.isPending;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-14 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text">Nguyên liệu</h1>
          <p className="mt-1 text-sm text-text/65">Theo dõi lượng còn dùng được, nhập thêm và đặt ngưỡng cảnh báo cho từng nguyên liệu.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void refetch()} disabled={isFetching} className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5 disabled:opacity-50">
            <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} /> Làm mới
          </button>
          <button type="button" onClick={() => { setShowCreate((current) => !current); setCreateError(null); }} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
            {showCreate ? <X size={16} /> : <Plus size={16} />}{showCreate ? 'Đóng biểu mẫu' : 'Thêm nguyên liệu'}
          </button>
        </div>
      </div>

      {createSuccess && <p role="status" className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 size={16} />{createSuccess}</p>}
      {showCreate && <form onSubmit={handleCreate} className="mt-5 rounded-2xl border border-primary/15 bg-white p-4 shadow-sm sm:p-5">
        <div><h2 className="text-lg font-extrabold text-text">Thêm nguyên liệu mới</h2><p className="mt-1 text-sm text-text/60">Số lượng được lưu theo đơn vị cơ sở. Nguyên liệu không theo dõi tồn để số lượng là trống.</p></div>
        {createError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{createError}</p>}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-semibold text-text">Mã nguyên liệu<input required maxLength={40} value={createForm.code} onChange={(event) => setCreateField('code', event.target.value.toUpperCase())} className={`${INPUT_CLASS} uppercase`} placeholder="VD: COFFEE_BEAN" /></label>
          <label className="text-sm font-semibold text-text">Tên nguyên liệu<input required maxLength={120} value={createForm.name} onChange={(event) => setCreateField('name', event.target.value)} className={INPUT_CLASS} placeholder="VD: Hạt cà phê" /></label>
          <label className="text-sm font-semibold text-text">Đơn vị cơ sở<select value={createForm.unit} onChange={(event) => setCreateField('unit', event.target.value as IngredientUnit)} className={INPUT_CLASS}><option value="G">Gram (g)</option><option value="ML">Mililít (ml)</option><option value="PIECE">Cái</option></select></label>
          <label className="text-sm font-semibold text-text">Tồn ban đầu ({UNIT_LABEL[createForm.unit]})<input type="number" inputMode="decimal" min="0" step={createForm.unit === 'PIECE' ? '1' : '0.001'} value={createForm.trackStock ? createForm.onHand : ''} onChange={(event) => setCreateField('onHand', event.target.value)} disabled={!createForm.trackStock} className={`${INPUT_CLASS} disabled:bg-gray-100 disabled:text-gray-400`} placeholder="0" /></label>
          <label className="text-sm font-semibold text-text">Một kiện chứa ({UNIT_LABEL[createForm.unit]})<input type="number" inputMode="decimal" min="0" step={createForm.unit === 'PIECE' ? '1' : '0.001'} value={createForm.packageQuantity} onChange={(event) => setCreateField('packageQuantity', event.target.value)} className={INPUT_CLASS} placeholder="Tùy chọn" /></label>
          <label className="text-sm font-semibold text-text">Cảnh báo dưới ({UNIT_LABEL[createForm.unit]})<input type="number" inputMode="decimal" min="0" step={createForm.unit === 'PIECE' ? '1' : '0.001'} value={createForm.trackStock ? createForm.lowStockThreshold : ''} onChange={(event) => setCreateField('lowStockThreshold', event.target.value)} disabled={!createForm.trackStock} className={`${INPUT_CLASS} disabled:bg-gray-100 disabled:text-gray-400`} placeholder="Tùy chọn" /></label>
          <div className="flex flex-col justify-end gap-2 pb-1 text-sm font-medium text-text"><label className="flex items-center gap-2"><input type="checkbox" checked={createForm.trackStock} onChange={(event) => setCreateField('trackStock', event.target.checked)} className="accent-primary" /> Theo dõi tồn kho</label><label className="flex items-center gap-2"><input type="checkbox" checked={createForm.isActive} onChange={(event) => setCreateField('isActive', event.target.checked)} className="accent-primary" /> Đang sử dụng</label></div>
          <div className="flex items-end"><button type="submit" disabled={createMutation.isPending} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50">{createMutation.isPending ? 'Đang tạo...' : 'Tạo nguyên liệu'}</button></div>
        </div>
      </form>}

      {!isPending && !isError && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-primary/10 bg-white p-4 shadow-sm"><p className="text-sm text-text/60">Tổng nguyên liệu</p><p className="mt-1 text-3xl font-extrabold text-primary">{ingredients.length}</p></div>
          <div className="rounded-2xl border border-primary/10 bg-white p-4 shadow-sm"><p className="text-sm text-text/60">Theo dõi tồn kho</p><p className="mt-1 text-3xl font-extrabold text-text">{trackedCount}</p></div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm"><p className="text-sm text-amber-800">Cần chú ý</p><p className="mt-1 text-3xl font-extrabold text-amber-800">{lowCount}</p></div>
        </div>
      )}

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 rounded-2xl border border-primary/10 bg-white p-4 shadow-sm sm:p-5" aria-label="Danh sách nguyên liệu">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-text/45" /><span className="sr-only">Tìm nguyên liệu</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên hoặc mã..." className="w-full rounded-xl border border-primary/15 bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary" /></label>
            <label><span className="sr-only">Lọc nguyên liệu</span><select value={filter} onChange={(event) => setFilter(event.target.value as StockFilter)} className="w-full rounded-xl border border-primary/15 bg-background px-3 py-2.5 text-sm outline-none focus:border-primary sm:w-auto"><option value="all">Tất cả</option><option value="low">Cần chú ý</option><option value="untracked">Không theo dõi tồn</option><option value="inactive">Tạm ngừng</option></select></label>
          </div>

          {isPending ? <p className="py-14 text-center text-sm text-text/60">Đang tải nguyên liệu...</p> :
            isError ? <div role="alert" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900"><div className="flex items-center gap-2 font-bold"><AlertTriangle size={18} /> Chưa tải được danh sách nguyên liệu</div><p className="mt-2">{getErrorMessage(error)}</p></div> :
              visibleIngredients.length === 0 ? <div className="py-14 text-center text-sm text-text/60">{ingredients.length === 0 ? 'Chưa có nguyên liệu nào trong hệ thống.' : 'Không có nguyên liệu phù hợp bộ lọc.'}</div> :
                <div className="mt-4 space-y-2">
                  {visibleIngredients.map((ingredient) => {
                    const available = ingredient.trackStock ? (amount(ingredient.onHand) ?? 0) - (amount(ingredient.reserved) ?? 0) : null;
                    const low = available !== null && available <= (amount(ingredient.lowStockThreshold) ?? 0);
                    return <button type="button" key={ingredient.id} onClick={() => selectIngredient(ingredient)} className={`flex w-full flex-col gap-3 rounded-xl border p-3 text-left transition hover:border-primary/40 hover:bg-primary/[0.03] sm:flex-row sm:items-center sm:justify-between ${selectedId === ingredient.id ? 'border-primary bg-primary/[0.05]' : 'border-primary/10'}`}>
                      <span className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Beaker size={19} /></span><span className="min-w-0"><span className="block truncate font-semibold text-text">{ingredient.name}</span><span className="block text-xs text-text/55">{ingredient.code} · {UNIT_LABEL[ingredient.unit]}{!ingredient.isActive ? ' · Tạm ngừng' : ''}</span></span></span>
                      <span className="flex items-center justify-between gap-4 pl-[52px] sm:block sm:pl-0 sm:text-right"><span className="block font-bold text-text">{ingredient.trackStock ? formatAmount(available, ingredient.unit) : 'Không theo dõi'}</span><span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${!ingredient.isActive ? 'bg-gray-100 text-gray-600' : low ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>{!ingredient.isActive ? 'Tạm ngừng' : low ? 'Cần nhập thêm' : 'Đủ nguyên liệu'}</span></span>
                    </button>;
                  })}
                </div>}
        </section>

        <aside className="min-w-0 self-start rounded-2xl border border-primary/10 bg-white p-5 shadow-sm" aria-label="Chi tiết nguyên liệu">
          {!selected ? <div className="flex min-h-56 flex-col items-center justify-center text-center"><Settings2 className="text-primary/40" size={28} /><h2 className="mt-3 font-bold text-text">Chi tiết nguyên liệu</h2><p className="mt-1 text-sm text-text/60">Chọn một nguyên liệu trong danh sách để xem hoặc cập nhật.</p></div> : <>
            <div className="flex items-start justify-between gap-2"><div><h2 className="text-lg font-extrabold text-text">{selected.name}</h2><p className="text-xs text-text/55">Mã {selected.code} · đơn vị {UNIT_LABEL[selected.unit]}</p></div><span className={`rounded-full px-2 py-1 text-xs font-bold ${selected.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{selected.isActive ? 'Đang dùng' : 'Tạm ngừng'}</span></div>
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-background p-3 text-center text-xs"><div><p className="text-text/60">Trong kho</p><p className="mt-1 font-bold text-text">{formatAmount(amount(selected.onHand), selected.unit)}</p></div><div><p className="text-text/60">Đã giữ</p><p className="mt-1 font-bold text-text">{formatAmount(amount(selected.reserved), selected.unit)}</p></div><div><p className="text-text/60">Có thể dùng</p><p className="mt-1 font-bold text-primary">{formatAmount(selectedAvailable, selected.unit)}</p></div></div>
            {formError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
            {success && <p role="status" className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 size={16} />{success}</p>}

            {selected.trackStock ? <form onSubmit={handleRestock} className="mt-5 border-t border-primary/10 pt-5"><h3 className="flex items-center gap-2 font-bold text-text"><PackagePlus size={17} className="text-primary" /> Nhập thêm nguyên liệu</h3><label className="mt-3 block text-sm font-medium text-text">Số lượng nhập ({UNIT_LABEL[selected.unit]})<input type="number" inputMode="decimal" min="0" step={selected.unit === 'PIECE' ? '1' : '0.001'} value={restockAmount} onChange={(event) => setRestockAmount(event.target.value)} className={INPUT_CLASS} placeholder={`Nhập số ${UNIT_LABEL[selected.unit]} cần cộng`} /></label>{selectedPackage !== null && <p className="mt-2 text-xs text-text/60">Một kiện tương đương {formatAmount(selectedPackage, selected.unit)}. <button type="button" onClick={() => setRestockAmount(String(Math.round(((Number(restockAmount) || 0) + selectedPackage) * 1000) / 1000))} className="font-semibold text-primary underline underline-offset-2">Thêm 1 kiện vào ô nhập</button></p>}<button type="submit" disabled={loadingMutation} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50"><ArrowDownToLine size={16} />{restockMutation.isPending ? 'Đang lưu...' : 'Xác nhận nhập hàng'}</button></form> : <p className="mt-5 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">Nguyên liệu này không quản lý tồn kho. Số lượng trong kho được để trống.</p>}

            <form onSubmit={handleUpdate} className="mt-5 border-t border-primary/10 pt-5"><h3 className="flex items-center gap-2 font-bold text-text"><Settings2 size={17} className="text-primary" /> Thông tin nguyên liệu</h3><label className="mt-3 block text-sm font-medium text-text">Tên nguyên liệu<input value={name} onChange={(event) => setName(event.target.value)} className={INPUT_CLASS} maxLength={120} /></label><div className="mt-3 grid grid-cols-2 gap-3"><label className="block text-sm font-medium text-text">Quy cách nhập ({UNIT_LABEL[selected.unit]})<input type="number" inputMode="decimal" min="0" step={selected.unit === 'PIECE' ? '1' : '0.001'} value={packageQuantity} onChange={(event) => setPackageQuantity(event.target.value)} className={INPUT_CLASS} placeholder="Không đặt" /></label><label className="block text-sm font-medium text-text">Cảnh báo dưới ({UNIT_LABEL[selected.unit]})<input type="number" inputMode="decimal" min="0" step={selected.unit === 'PIECE' ? '1' : '0.001'} value={lowStockThreshold} onChange={(event) => setLowStockThreshold(event.target.value)} className={INPUT_CLASS} placeholder="Không đặt" disabled={!selected.trackStock} /></label></div><label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-medium text-text"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="accent-primary" /> Đang sử dụng trong công thức</label><button type="submit" disabled={loadingMutation} className="mt-4 w-full rounded-xl border border-primary px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/5 disabled:opacity-50">{updateMutation.isPending ? 'Đang lưu...' : 'Lưu thông tin'}</button></form>
          </>}
        </aside>
      </div>
    </main>
  );
}
