import { useState } from "react";
import { X } from "lucide-react";

const categories = [
  "Medical",
  "Food & Water",
  "Shelter",
  "Transportation",
  "Clothing",
  "Emergency Response",
  "Sanitation",
  "Communication",
  "Other",
];

export default function NGOResourceForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    quantity: "",
    peopleCapacity: "",
    location: "",
    additionalInfo: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitForm = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="card mb-6 bg-blue-50 border border-blue-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Add Resource</h3>
        <button onClick={onCancel}><X /></button>
      </div>

      <form onSubmit={submitForm}>
        <label className="block mb-2">Category</label>
        <select name="category" value={formData.category} onChange={handleChange} className="input-field mb-4">
          <option value="">Select</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>

        <label className="block mb-2">Description</label>
        <textarea name="description" value={formData.description} onChange={handleChange} className="textarea mb-4" />

        <label className="block mb-2">Quantity</label>
        <input name="quantity" type="number" className="input-field mb-4" value={formData.quantity} onChange={handleChange} />

        <label className="block mb-2">People Capacity</label>
        <input name="peopleCapacity" type="number" className="input-field mb-4" value={formData.peopleCapacity} onChange={handleChange} />

        <label className="block mb-2">Location</label>
        <input name="location" type="text" className="input-field mb-4" value={formData.location} onChange={handleChange} />

        <button className="button-primary w-full mt-4">Save Resource</button>
      </form>
    </div>
  );
}
