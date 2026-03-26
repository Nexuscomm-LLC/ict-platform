import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  Barcode,
  Camera,
  X,
  Minus,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchInventory, updateQuantity, lookupBarcode, setFilters } from '../store/slices/inventorySlice';
import { addToast, openModal } from '../store/slices/uiSlice';
import type { InventoryItem } from '../types';

export default function Inventory() {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, selectedItem, isLoading, filters } = useAppSelector((state) => state.inventory);
  const [scannerActive, setScannerActive] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const category = searchParams.get('category');
    const search = searchParams.get('search') || '';
    const lowStock = searchParams.get('low_stock') === 'true';
    dispatch(setFilters({ category, search, lowStock }));
    dispatch(fetchInventory({ category: category || undefined, search, low_stock: lowStock }));
  }, [dispatch, searchParams]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams);
    if (value) params.set('search', value);
    else params.delete('search');
    setSearchParams(params);
  };

  const toggleLowStock = () => {
    const params = new URLSearchParams(searchParams);
    if (filters.lowStock) params.delete('low_stock');
    else params.set('low_stock', 'true');
    setSearchParams(params);
  };

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setScannerActive(true);
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Camera access denied' }));
    }
  };

  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScannerActive(false);
  };

  const handleManualBarcode = async () => {
    if (!manualBarcode.trim()) return;
    try {
      await dispatch(lookupBarcode(manualBarcode)).unwrap();
      dispatch(openModal({ type: 'inventory-detail' }));
      setManualBarcode('');
    } catch {
      dispatch(addToast({ type: 'error', message: 'Item not found' }));
    }
  };

  const handleQuantityChange = async (item: InventoryItem, delta: number) => {
    const newQuantity = Math.max(0, item.quantity + delta);
    try {
      await dispatch(updateQuantity({
        id: item.id,
        quantity: newQuantity,
        reason: delta > 0 ? 'Manual add' : 'Manual remove',
      })).unwrap();
      dispatch(addToast({ type: 'success', message: 'Quantity updated' }));
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to update quantity' }));
    }
  };

  const lowStockItems = items.filter((i) => i.quantity <= i.min_quantity);

  return (
    <div className="inventory-page">
      <header className="page-header">
        <h1>Inventory</h1>
        <div className="header-actions">
          <button className="btn-scan" onClick={startScanner}>
            <Camera size={20} />
            Scan
          </button>
          <Link to="/inventory/new" className="btn-primary">
            <Plus size={20} />
            Add Item
          </Link>
        </div>
      </header>

      {lowStockItems.length > 0 && (
        <div className="low-stock-alert" onClick={toggleLowStock}>
          <AlertTriangle size={20} />
          <span>{lowStockItems.length} items are low on stock</span>
        </div>
      )}

      <div className="toolbar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search inventory..."
            value={filters.search}
            onChange={handleSearch}
          />
        </div>

        <div className="barcode-input">
          <Barcode size={20} />
          <input
            type="text"
            placeholder="Enter barcode..."
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualBarcode()}
          />
        </div>

        <button
          className={`btn-filter ${filters.lowStock ? 'active' : ''}`}
          onClick={toggleLowStock}
        >
          <AlertTriangle size={16} />
          Low Stock
        </button>
      </div>

      {scannerActive && (
        <div className="scanner-overlay">
          <div className="scanner-container">
            <button className="close-scanner" onClick={stopScanner}>
              <X size={24} />
            </button>
            <video ref={videoRef} autoPlay playsInline />
            <div className="scanner-frame" />
            <p>Position barcode within frame</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="loading-spinner" />
      ) : items.length === 0 ? (
        <div className="empty-state">
          <Package size={48} />
          <h3>No items found</h3>
          <p>Add inventory items to track stock levels</p>
          <Link to="/inventory/new" className="btn-primary">
            <Plus size={20} />
            Add Item
          </Link>
        </div>
      ) : (
        <div className="inventory-grid">
          {items.map((item) => (
            <div key={item.id} className={`inventory-card ${item.quantity <= item.min_quantity ? 'low-stock' : ''}`}>
              <div className="item-header">
                <span className="item-sku">{item.sku}</span>
                <span className="item-category">{item.category}</span>
              </div>

              <h3 className="item-name">{item.name}</h3>

              <div className="item-quantity">
                <button onClick={() => handleQuantityChange(item, -1)}>
                  <Minus size={16} />
                </button>
                <span className={item.quantity <= item.min_quantity ? 'warning' : ''}>
                  {item.quantity}
                </span>
                <button onClick={() => handleQuantityChange(item, 1)}>
                  <Plus size={16} />
                </button>
              </div>

              {item.quantity <= item.min_quantity && (
                <div className="low-stock-badge">
                  <AlertTriangle size={14} />
                  Low Stock (Min: {item.min_quantity})
                </div>
              )}

              <div className="item-footer">
                <span className="item-price">${item.unit_price.toFixed(2)}</span>
                {item.location && <span className="item-location">{item.location}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .inventory-page { padding: 24px; max-width: 1400px; margin: 0 auto; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .page-header h1 { font-size: 24px; margin: 0; }
        .header-actions { display: flex; gap: 12px; }
        .btn-primary, .btn-scan {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 20px; border-radius: 8px; border: none;
          font-weight: 600; cursor: pointer; text-decoration: none;
        }
        .btn-primary { background: var(--primary); color: white; }
        .btn-scan { background: var(--bg-secondary); color: var(--text-primary); }
        .low-stock-alert {
          display: flex; align-items: center; gap: 12px;
          background: #fef3c7; color: #92400e;
          padding: 16px; border-radius: 12px; margin-bottom: 24px; cursor: pointer;
        }
        .toolbar { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
        .search-box, .barcode-input {
          display: flex; align-items: center; gap: 12px;
          background: var(--bg-primary); border: 1px solid var(--border-color);
          border-radius: 8px; padding: 0 16px;
        }
        .search-box { flex: 1; min-width: 200px; }
        .barcode-input { min-width: 180px; }
        .search-box input, .barcode-input input {
          border: none; background: none; padding: 12px 0;
          font-size: 16px; width: 100%; outline: none;
        }
        .btn-filter {
          display: flex; align-items: center; gap: 8px;
          background: var(--bg-primary); border: 1px solid var(--border-color);
          padding: 12px 16px; border-radius: 8px; cursor: pointer;
        }
        .btn-filter.active { background: #fef3c7; border-color: #f59e0b; color: #92400e; }
        .scanner-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.9);
          display: flex; align-items: center; justify-content: center; z-index: 100;
        }
        .scanner-container { position: relative; text-align: center; }
        .close-scanner {
          position: absolute; top: -48px; right: 0;
          background: none; border: none; color: white; cursor: pointer;
        }
        .scanner-container video { max-width: 100%; border-radius: 12px; }
        .scanner-frame {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: 250px; height: 150px; border: 2px solid #22c55e;
          border-radius: 8px;
        }
        .scanner-container p { color: white; margin-top: 16px; }
        .inventory-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        .inventory-card {
          background: var(--bg-primary); border-radius: 12px; padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .inventory-card.low-stock { border: 2px solid #f59e0b; }
        .item-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .item-sku { font-size: 12px; color: var(--text-muted); font-weight: 500; }
        .item-category {
          font-size: 12px; background: var(--bg-secondary);
          padding: 2px 8px; border-radius: 4px;
        }
        .item-name { font-size: 16px; font-weight: 600; margin: 0 0 16px; }
        .item-quantity {
          display: flex; align-items: center; justify-content: center; gap: 16px;
          margin-bottom: 12px;
        }
        .item-quantity button {
          width: 32px; height: 32px; border-radius: 8px;
          background: var(--bg-secondary); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .item-quantity span { font-size: 24px; font-weight: 700; min-width: 60px; text-align: center; }
        .item-quantity span.warning { color: #f59e0b; }
        .low-stock-badge {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          background: #fef3c7; color: #92400e;
          padding: 8px; border-radius: 6px; font-size: 13px; margin-bottom: 12px;
        }
        .item-footer { display: flex; justify-content: space-between; color: var(--text-muted); font-size: 14px; }
        .item-price { font-weight: 600; color: var(--primary); }
        .empty-state {
          text-align: center; padding: 64px 24px;
          background: var(--bg-primary); border-radius: 16px;
        }
        .empty-state svg { color: var(--text-muted); margin-bottom: 16px; }
        .empty-state h3 { margin: 0 0 8px; }
        .empty-state p { color: var(--text-muted); margin: 0 0 24px; }
        .loading-spinner { width: 40px; height: 40px; border: 3px solid var(--bg-secondary); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 64px auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
