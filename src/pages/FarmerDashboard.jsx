import { useEffect, useState, useRef } from 'react';
import { fetchAiPriceSuggestion } from '../utils/api.js';
import ProductCard from '../components/ProductCard.jsx';
import { addProduct, listProducts, removeProduct } from '../utils/db.js';
import { auth } from '../firebase/config.js';
import { allLocations } from '../constants/sriLankanLocations.js';

export default function FarmerDashboard() {
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState({ variety: '', imageFile: null, quantity: 0, location: '' });
    const [aiPrice, setAiPrice] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (form.variety) {
            // Fetch AI price suggestion based on variety only (per kg price)
            fetchAiPriceSuggestion({ variety: form.variety, quantity: 1 })
                .then((res) => setAiPrice(res.price))
                .catch(() => setAiPrice(null));
        } else {
            setAiPrice(null);
        }
    }, [form.variety]);

    useEffect(() => {
        // Load products
        (async () => {
            const all = await listProducts();
            const uid = auth.currentUser?.uid;
            const mine = uid ? all.filter(p => p.ownerUid === uid) : all;
            setProducts(mine.slice(0, 6));
        })();
    }, []);

    const refresh = async () => {
        const all = await listProducts();
        const uid = auth.currentUser?.uid;
        const mine = uid ? all.filter(p => p.ownerUid === uid) : all;
        setProducts(mine.slice(0, 6));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm({ ...form, imageFile: file });

            // Create preview URL
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const onAddProduct = async (e) => {
        e.preventDefault();
        setIsUploading(true);

        try {
            let imageUrl = '';

            // Upload image if file is selected
            if (form.imageFile) {
                // For now, use base64 directly to avoid CORS issues
                const reader = new FileReader();
                imageUrl = await new Promise((resolve, reject) => {
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(form.imageFile);
                });

            }

            // Remove imageFile from form data since we're storing it as imageUrl
            const { imageFile, ...formDataWithoutFile } = form;

            await addProduct({
                ...formDataWithoutFile,
                quantity: Number(form.quantity),
                aiPrice,
                imageUrl
            });

            setForm({ variety: '', imageFile: null, quantity: 0, location: '' });
            setAiPrice(null);
            setImagePreview(null);

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            await refresh();
        } catch (error) {
            console.error('Error adding product:', error);
            alert('Failed to add product: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const onDelete = async (id) => {
        await removeProduct(id);
        await refresh();
    };


    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <h2 className="text-2xl font-semibold">Farmer Dashboard</h2>

            <form
                onSubmit={onAddProduct}
                className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white border rounded-lg p-4"
            >
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rice Variety
                    </label>
                    <select
                        className="border rounded px-3 py-2 w-full"
                        value={form.variety}
                        onChange={(e) => setForm({ ...form, variety: e.target.value })}
                    >
                        <option value="">Select Rice Variety</option>
                        <option value="Samba">Samba</option>
                        <option value="Nadu">Nadu</option>
                        <option value="Keeri Samba">Keeri Samba</option>
                        <option value="Red Nadu">Red Nadu</option>
                        <option value="White Raw">White Raw</option>
                        <option value="Red Raw">Red Raw</option>
                        <option value="Suwandel">Suwandel</option>
                        <option value="Kalu Heenati">Kalu Heenati</option>
                        <option value="Masuran">Masuran</option>
                        <option value="Ma Wee">Ma Wee</option>
                        <option value="Kurulu Thuda">Kurulu Thuda</option>
                        <option value="Rath Suwandal">Rath Suwandal</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Product Image
                    </label>
                    <input
                        ref={fileInputRef}
                        className="border rounded px-3 py-2 w-full"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                    />
                    {imagePreview && (
                        <div className="mt-2">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-32 h-32 object-cover rounded border"
                            />
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm text-gray-600">Image Preview</p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setForm({ ...form, imageFile: null });
                                        setImagePreview(null);
                                    }}
                                    className="text-xs text-red-600 hover:text-red-800"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity (kg)
                    </label>
                    <input
                        className="border rounded px-3 py-2 w-full"
                        placeholder="Enter quantity"
                        type="number"
                        value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                    </label>
                    <select
                        className="border rounded px-3 py-2 w-full"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                    >
                        <option value="">Select Location</option>
                        {allLocations.map(location => (
                            <option key={location} value={location}>{location}</option>
                        ))}
                    </select>
                </div>
                <div className="md:col-span-2 flex items-center gap-2">
                    <button
                        type="submit"
                        className={`bg-green-600 text-white rounded px-4 py-2 ${isUploading
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-green-700"
                            }`}
                        disabled={isUploading}
                    >
                        {isUploading ? "Adding..." : "Add Product"}
                    </button>
                    {aiPrice && (
                        <span className="text-sm text-green-700 font-medium">
                            AI Predicted: LKR {aiPrice} per kg
                        </span>
                    )}
                </div>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                    <div key={p.id} className="relative">
                        <ProductCard product={p} />
                        <button onClick={() => onDelete(p.id)} className="absolute top-2 right-2 bg-white/90 border text-xs px-2 py-1 rounded">Delete</button>
                    </div>
                ))}
            </div>
        </div>
    );
}


