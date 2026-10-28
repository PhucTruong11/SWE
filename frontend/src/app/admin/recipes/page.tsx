'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { AlertCircle, BookOpen, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import api from '@/lib/api';

type Size = 'S' | 'M' | 'L';
type IngredientUnit = 'G' | 'ML' | 'PIECE';

interface Product {
  id: string;
  name: string;
  isAvailable: boolean;
  prices: { size: Size }[];
}

interface Topping {
  id: string;
  name: string;
  isAvailable: boolean;
}

interface Ingredient {
  id: string;
  code: string;
  name: string;
  unit: IngredientUnit;
  trackStock: boolean;
  isActive: boolean;
}

interface RecipeLine {
  ingredientId: string;
  quantity: string | number;
}

interface DraftLine {
  key: number;
  ingredientId: string;
  quantity: string;
}

type RecipeTarget =
  | { kind: 'product'; id: string; size: Size; name: string }
  | { kind: 'topping'; id: string; name: string };

const SIZE_ORDER: Size[] = ['S', 'M', 'L'];
const FIELD_CLASS = 'w-full rounded-xl border border-primary/20 bg-white px-3 py-2.5 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-background';

function messageFromError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404 || error.response?.status === 405) {
      return 'Chức năng quản lý công thức chưa sẵn sàng. Vui lòng thử lại sau.';
    }
    const message: unknown = error.response?.data?.message;
    if (Array.isArray(message)) return message.map(String).join('. ');
    if (typeof message === 'string') return message;
  }
  return 'Không kết nối được với API. Vui lòng thử lại.';
}

function unitLabel(unit: IngredientUnit): string {
  return unit === 'G' ? 'g' : unit === 'ML' ? 'ml' : 'cái';
}

function validateLines(lines: DraftLine[], ingredients: Ingredient[]): string | null {
  if (lines.length === 0) return 'Công thức cần ít nhất một nguyên liệu.';
  const ids = new Set<string>();
  for (const line of lines) {
    if (!line.ingredientId) return 'Hãy chọn nguyên liệu cho mọi dòng.';
    if (ids.has(line.ingredientId)) return 'Một nguyên liệu chỉ được xuất hiện một lần trong công thức.';
    ids.add(line.ingredientId);
    const ingredient = ingredients.find((entry) => entry.id === line.ingredientId);
    if (!ingredient) return 'Có nguyên liệu không còn trong danh mục.';
    if (!ingredient.isActive) return `Nguyên liệu ${ingredient.name} đã ngừng sử dụng.`;
    const value = line.quantity.trim();
    if (!/^\d+(?:\.\d{1,3})?$/.test(value) || Number(value) <= 0) {
      return `Định lượng của ${ingredient.name} phải lớn hơn 0 và có tối đa 3 chữ số thập phân.`;
    }
    if (ingredient.unit === 'PIECE' && !Number.isInteger(Number(value))) {
      return `Định lượng của ${ingredient.name} phải là số nguyên.`;
    }
  }
  return null;
}

function RecipeEditor({ target, ingredients }: { target: RecipeTarget; ingredients: Ingredient[] }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<DraftLine[] | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [nextKey, setNextKey] = useState(1);
  const queryKey = ['admin-recipe', target.kind, target.id, target.kind === 'product' ? target.size : null] as const;

  // Hợp đồng API dự kiến: GET trả các dòng công thức của đúng sản phẩm-size hoặc topping.
  const recipeQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const params = target.kind === 'product'
        ? { productId: target.id, size: target.size }
        : { toppingId: target.id };
      const response = await api.get<{ data: RecipeLine[] }>('/admin/recipes', { params });
      if (!Array.isArray(response.data.data)) throw new Error('Dữ liệu công thức không hợp lệ.');
      return response.data.data;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const savedLines = recipeQuery.data ?? [];
  const lines: DraftLine[] = draft ?? savedLines.map((line, index) => ({
    key: index + 1,
    ingredientId: line.ingredientId,
    quantity: String(line.quantity),
  }));
  const isDirty = draft !== null && JSON.stringify(draft.map(({ ingredientId, quantity }) => ({ ingredientId, quantity }))) !==
    JSON.stringify(savedLines.map(({ ingredientId, quantity }) => ({ ingredientId, quantity: String(quantity) })));
  const canEdit = recipeQuery.isSuccess && ingredients.length > 0;

  const saveMutation = useMutation({
    mutationFn: async (payload: { ingredientId: string; quantity: number }[]) => {
      const path = target.kind === 'product'
        ? `/admin/recipes/products/${target.id}/${target.size}`
        : `/admin/recipes/toppings/${target.id}`;
      // PUT thay toàn bộ công thức của đối tượng; backend cần xử lý trong một transaction.
      await api.put(path, { ingredients: payload });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      setDraft(null);
      setFormError(null);
      setNotice('Đã lưu công thức. Đơn tạo sau thời điểm này sẽ dùng định lượng mới.');
    },
    onError: (error) => {
      setNotice(null);
      setFormError(messageFromError(error));
    },
  });

  function updateLine(key: number, field: 'ingredientId' | 'quantity', value: string) {
    setDraft(lines.map((line) => line.key === key ? { ...line, [field]: value } : line));
    setFormError(null);
    setNotice(null);
  }

  function addLine() {
    const available = ingredients.find((ingredient) => ingredient.isActive && !lines.some((line) => line.ingredientId === ingredient.id));
    if (!available) {
      setFormError('Đã thêm hết các nguyên liệu đang hoạt động.');
      return;
    }
    const key = Math.max(nextKey, ...lines.map((line) => line.key + 1));
    setDraft([...lines, { key, ingredientId: available.id, quantity: '' }]);
    setNextKey(key + 1);
    setFormError(null);
    setNotice(null);
  }

  function saveRecipe() {
    const error = validateLines(lines, ingredients);
    if (error) {
      setFormError(error);
      return;
    }
    setFormError(null);
    setNotice(null);
    saveMutation.mutate(lines.map((line) => ({ ingredientId: line.ingredientId, quantity: Number(line.quantity) })));
  }

  return (
    <section className="min-w-0 rounded-2xl border border-primary/15 bg-surface p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-primary/10 pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Công thức một phần</p>
          <h2 className="mt-1 text-xl font-extrabold text-text">{target.name}{target.kind === 'product' ? ` · Size ${target.size}` : ' · Topping'}</h2>
          <p className="mt-1 text-sm text-text/65">Định lượng của một ly hoặc một phần topping, theo đơn vị của từng nguyên liệu.</p>
        </div>
        {recipeQuery.isSuccess && (
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${isDirty ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
            {isDirty ? 'Có thay đổi chưa lưu' : 'Đã đồng bộ'}
          </span>
        )}
      </div>

      {recipeQuery.isPending ? (
        <div className="py-14 text-center text-sm text-text/60">Đang tải công thức...</div>
      ) : recipeQuery.isError ? (
        <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-start gap-2"><AlertCircle className="mt-0.5 shrink-0" size={18} /><span>{messageFromError(recipeQuery.error)}</span></div>
          <button type="button" onClick={() => void recipeQuery.refetch()} className="mt-3 font-bold underline">Thử tải lại</button>
        </div>
      ) : (
        <>
          <div className="mt-5 space-y-3">
            {lines.length === 0 && <p className="rounded-xl border border-dashed border-primary/20 bg-background p-5 text-sm text-text/60">Công thức này chưa có nguyên liệu. Thêm dòng đầu tiên để bắt đầu.</p>}
            {lines.map((line, index) => {
              const selected = ingredients.find((ingredient) => ingredient.id === line.ingredientId);
              const usedByOtherLines = new Set(lines.filter((item) => item.key !== line.key).map((item) => item.ingredientId));
              return (
                <div key={line.key} className="grid gap-3 rounded-xl border border-primary/10 bg-background p-3 sm:grid-cols-[minmax(0,1.5fr)_minmax(110px,0.7fr)_auto] sm:items-end">
                  <label className="block text-xs font-semibold text-text/70">
                    Nguyên liệu {index + 1}
                    <select value={line.ingredientId} disabled={!canEdit || saveMutation.isPending} onChange={(event) => updateLine(line.key, 'ingredientId', event.target.value)} className={`${FIELD_CLASS} mt-1`}>
                      <option value="">Chọn nguyên liệu</option>
                      {ingredients.filter((ingredient) => ingredient.isActive || ingredient.id === line.ingredientId).map((ingredient) => (
                        <option key={ingredient.id} value={ingredient.id} disabled={usedByOtherLines.has(ingredient.id)}>
                          {ingredient.name} ({unitLabel(ingredient.unit)}){ingredient.isActive ? '' : ' · đã ngừng'}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-text/70">
                    Định lượng / phần
                    <div className="relative mt-1">
                      <input type="number" inputMode="decimal" min={selected?.unit === 'PIECE' ? '1' : '0.001'} step={selected?.unit === 'PIECE' ? '1' : '0.001'} value={line.quantity} disabled={!canEdit || saveMutation.isPending} onChange={(event) => updateLine(line.key, 'quantity', event.target.value)} className={`${FIELD_CLASS} pr-12`} placeholder="0" />
                      <span className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-text/50">{selected ? unitLabel(selected.unit) : '—'}</span>
                    </div>
                  </label>
                  <button type="button" aria-label={`Xóa nguyên liệu dòng ${index + 1}`} title="Xóa dòng" disabled={!canEdit || saveMutation.isPending} onClick={() => { setDraft(lines.filter((item) => item.key !== line.key)); setFormError(null); setNotice(null); }} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40">
                    <Trash2 size={17} />
                  </button>
                </div>
              );
            })}
          </div>

          <button type="button" onClick={addLine} disabled={!canEdit || saveMutation.isPending} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-primary/30 px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/5 disabled:opacity-50">
            <Plus size={17} /> Thêm nguyên liệu
          </button>
          {formError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{formError}</p>}
          {notice && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-primary/10 pt-5">
            <p className="max-w-md text-xs leading-5 text-text/60">Nước vẫn nằm trong công thức dù không theo dõi tồn. Ly và ống hút phải được tính vào từng ly cần pha.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => { setDraft(null); setFormError(null); setNotice(null); }} disabled={!isDirty || saveMutation.isPending} className="inline-flex items-center gap-2 rounded-xl border border-primary/20 px-4 py-2.5 text-sm font-semibold text-text hover:bg-background disabled:opacity-40"><RotateCcw size={16} /> Bỏ thay đổi</button>
              <button type="button" onClick={saveRecipe} disabled={!canEdit || !isDirty || saveMutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"><Save size={16} /> {saveMutation.isPending ? 'Đang lưu...' : 'Lưu công thức'}</button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default function AdminRecipesPage() {
  const [mode, setMode] = useState<'product' | 'topping'>('product');
  const [productId, setProductId] = useState('');
  const [toppingId, setToppingId] = useState('');
  const [size, setSize] = useState<Size>('S');

  const productsQuery = useQuery({
    queryKey: ['admin-recipe-products'],
    queryFn: async () => (await api.get<{ data: Product[] }>('/admin/products')).data.data,
    retry: false,
  });
  const toppingsQuery = useQuery({
    queryKey: ['admin-recipe-toppings'],
    queryFn: async () => (await api.get<{ data: Topping[] }>('/products/toppings')).data.data,
    retry: false,
  });
  const ingredientsQuery = useQuery({
    queryKey: ['admin-ingredients'],
    queryFn: async () => (await api.get<{ data: Ingredient[] }>('/admin/ingredients')).data.data,
    retry: false,
  });

  const products = (productsQuery.data ?? []).filter((product) => product.isAvailable);
  const toppings = (toppingsQuery.data ?? []).filter((topping) => topping.isAvailable);
  const selectedProduct = products.find((product) => product.id === productId) ?? products[0];
  const selectedTopping = toppings.find((topping) => topping.id === toppingId) ?? toppings[0];
  const sizes = selectedProduct?.prices.map((price) => price.size).filter((item): item is Size => SIZE_ORDER.includes(item)) ?? [];
  const selectedSize = sizes.includes(size) ? size : (sizes[0] ?? 'S');
  const target: RecipeTarget | null = mode === 'product'
    ? selectedProduct && sizes.length > 0 ? { kind: 'product', id: selectedProduct.id, size: selectedSize, name: selectedProduct.name } : null
    : selectedTopping ? { kind: 'topping', id: selectedTopping.id, name: selectedTopping.name } : null;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8">
      <div className="flex items-center gap-3">
        <span className="rounded-2xl bg-primary/10 p-3 text-primary"><BookOpen size={25} /></span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text">Công thức pha chế</h1>
          <p className="mt-1 text-sm text-text/65">Quản lý định lượng cho từng size đồ uống và từng phần topping. Các size của cùng món dùng cùng loại nguyên liệu, chỉ khác số lượng.</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-text/70">
        Công thức thay đổi chỉ áp dụng cho đơn được tạo sau khi lưu. Đơn đã tạo giữ nguyên định lượng tại thời điểm đặt.
      </div>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-primary/15 bg-surface p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-extrabold text-text">Chọn công thức</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-background p-1">
            <button type="button" onClick={() => setMode('product')} className={`rounded-lg px-2 py-2 text-sm font-semibold ${mode === 'product' ? 'bg-primary text-white shadow-sm' : 'text-text/70 hover:text-primary'}`}>Đồ uống</button>
            <button type="button" onClick={() => setMode('topping')} className={`rounded-lg px-2 py-2 text-sm font-semibold ${mode === 'topping' ? 'bg-primary text-white shadow-sm' : 'text-text/70 hover:text-primary'}`}>Topping</button>
          </div>

          {mode === 'product' ? (
            <>
              <label className="mt-5 block text-sm font-semibold text-text">Sản phẩm
                <select value={selectedProduct?.id ?? ''} onChange={(event) => { setProductId(event.target.value); setSize('S'); }} disabled={productsQuery.isPending || productsQuery.isError || products.length === 0} className={`${FIELD_CLASS} mt-2`}>
                  {products.length === 0 && <option value="">Chưa có sản phẩm</option>}
                  {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                </select>
              </label>
              {productsQuery.isError && <p role="alert" className="mt-2 text-xs text-red-700">Không tải được sản phẩm. <button type="button" onClick={() => void productsQuery.refetch()} className="font-bold underline">Thử lại</button></p>}
              {selectedProduct && <div className="mt-5"><p className="text-sm font-semibold text-text">Size</p><div className="mt-2 flex flex-wrap gap-2">{SIZE_ORDER.filter((item) => sizes.includes(item)).map((item) => <button key={item} type="button" onClick={() => setSize(item)} className={`h-10 min-w-10 rounded-xl border px-3 text-sm font-bold ${selectedSize === item ? 'border-primary bg-primary text-white' : 'border-primary/20 bg-white text-text hover:border-primary'}`}>{item}</button>)}</div></div>}
            </>
          ) : (
            <>
              <label className="mt-5 block text-sm font-semibold text-text">Topping
                <select value={selectedTopping?.id ?? ''} onChange={(event) => setToppingId(event.target.value)} disabled={toppingsQuery.isPending || toppingsQuery.isError || toppings.length === 0} className={`${FIELD_CLASS} mt-2`}>
                  {toppings.length === 0 && <option value="">Chưa có topping</option>}
                  {toppings.map((topping) => <option key={topping.id} value={topping.id}>{topping.name}</option>)}
                </select>
              </label>
              {toppingsQuery.isError && <p role="alert" className="mt-2 text-xs text-red-700">Không tải được topping. <button type="button" onClick={() => void toppingsQuery.refetch()} className="font-bold underline">Thử lại</button></p>}
            </>
          )}
          <div className="mt-6 border-t border-primary/10 pt-4 text-xs leading-5 text-text/60">Đơn vị của công thức là g, ml hoặc cái cho một phần. Mỗi size đồ uống có định lượng riêng.</div>
        </aside>

        <div className="min-w-0 space-y-4">
          {ingredientsQuery.isPending ? <div className="rounded-2xl border border-primary/15 bg-surface p-8 text-sm text-text/60">Đang tải danh mục nguyên liệu...</div> :
            ingredientsQuery.isError ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"><div className="flex items-start gap-2"><AlertCircle className="mt-0.5 shrink-0" size={18} /><span>{messageFromError(ingredientsQuery.error)} Trang công thức cần danh mục nguyên liệu để chỉnh sửa.</span></div><button type="button" onClick={() => void ingredientsQuery.refetch()} className="mt-3 font-bold underline">Thử tải lại</button></div> :
            !target ? <div className="rounded-2xl border border-dashed border-primary/20 bg-surface p-8 text-sm text-text/60">Chưa có sản phẩm, size hoặc topping đang kinh doanh để chọn.</div> :
            <RecipeEditor key={`${target.kind}:${target.id}:${target.kind === 'product' ? target.size : ''}`} target={target} ingredients={ingredientsQuery.data ?? []} />}
        </div>
      </div>
    </main>
  );
}
