import { useEffect, useState } from "react";
import { fetchAiPriceSuggestion } from "../utils/api.js";
import ProductCard from "../components/ProductCard.jsx";
import { addProduct, listProducts, removeProduct } from "../utils/db.js";
import { uploadImage } from "../utils/storage.js";
import { auth } from "../firebase/config.js";

export default function FarmerDashboard() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    imageFile: null,
    quantity: 0,
    location: "",
    variety: "Samba",
  });
  const [aiPrice, setAiPrice] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

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

  useEffect(() => {
    if (form.variety) {
      fetchAiPriceSuggestion({ variety: form.variety })
        .then((res) => {
          setAiPrice(res.price);
          setAiRecommendation(res.recommendation);
          setCurrentPrice(res.currentPrice);
        })
        .catch(() => {
          setAiPrice(null);
          setAiRecommendation(null);
          setCurrentPrice(null);
        });
    } else {
      setAiPrice(null);
      setAiRecommendation(null);
      setCurrentPrice(null);
    }
  }, [form.variety]);

  useEffect(() => {
    (async () => {
      const all = await listProducts();
      const uid = auth.currentUser?.uid;
      const mine = uid ? all.filter((p) => p.ownerUid === uid) : all;
      setProducts(mine.slice(0, 6));
    })();
  }, []);

  const refresh = async () => {
    const all = await listProducts();
    const uid = auth.currentUser?.uid;
    const mine = uid ? all.filter((p) => p.ownerUid === uid) : all;
    setProducts(mine.slice(0, 6));
  };

  const onAddProduct = async (e) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (isSubmitting) return;

    // Validate required fields
    if (!form.quantity || !form.location) {
      alert(
        "Please fill in all required fields (Quantity, Location)"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;

      // Upload image if provided
      if (form.imageFile) {
        console.log("Uploading image...");
        imageUrl = await uploadImage(form.imageFile);
        console.log("Image uploaded:", imageUrl);
      }

      // Prepare product data (exclude imageFile, include imageUrl)
      const productData = {
        quantity: Number(form.quantity),
        location: form.location,
        variety: form.variety,
        aiPrice,
        imageUrl,
      };

      console.log("Adding product:", productData);
      await addProduct(productData);
      console.log("Product added successfully");

      // Reset form
      setForm({
        imageFile: null,
        quantity: 0,
        location: "",
        variety: "Samba",
      });
      setAiPrice(null);
      setAiRecommendation(null);
      setCurrentPrice(null);
      setImagePreview(null);

      // Refresh the product list
      await refresh();

      alert("Product added successfully!");
    } catch (error) {
      console.error("Failed to add product:", error);
      alert("Failed to add product: ${error.message}");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = async (id) => {
    await removeProduct(id);
    await refresh();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold">Farmer Dashboard</h2>

      {/* AI Price Information */}
      {aiPrice && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            AI Price Prediction
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Current Price:</span>
              <span className="ml-2 text-green-600">LKR {currentPrice}</span>
            </div>
            <div>
              <span className="font-medium">Predicted Price:</span>
              <span className="ml-2 text-blue-600">LKR {aiPrice}</span>
            </div>
            <div>
              <span className="font-medium">Recommendation:</span>
              <span className="ml-2 text-orange-600">{aiRecommendation}</span>
            </div>
          </div>
        </div>
      )}
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
            <option value="Village A">Village A</option>
            <option value="Town B">Town B</option>
          </select>
        </div>
        <div className="md:col-span-2 flex items-center gap-2">
          <button
            className={`bg-green-600 text-white rounded px-4 py-2 ${
              isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-green-700"
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add Product"}
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
            <button
              onClick={() => onDelete(p.id)}
              className="absolute top-2 right-2 bg-white/90 border text-xs px-2 py-1 rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}