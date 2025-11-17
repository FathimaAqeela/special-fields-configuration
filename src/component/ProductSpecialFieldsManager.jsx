import React, { useEffect, useState } from 'react';
import { HiTrash } from 'react-icons/hi';
import { FaGripVertical } from 'react-icons/fa';
import { AiFillEye } from 'react-icons/ai';

const initialField = () => ({
  id: `f-${Date.now()}`,
  label: '',
  type: 'Text',
  required: false,
  pricingModel: 'Base',
  price: 0,
  min: null,
  max: null,
  options: [],
});

export default function ProductSpecialFieldsManager() {
  const [product, setProduct] = useState({ name: '', description: '', basePrice: 0 });
  const [enableFields, setEnableFields] = useState(true);
  const [fields, setFields] = useState([initialField()]);
  const [errors, setErrors] = useState({});
  const [customerInputs, setCustomerInputs] = useState({});

  const addField = () => {
    if (fields.length >= 4) return;
    setFields(s => [...s, initialField()]);
  };

  const removeField = id => {
    setFields(s => s.filter(f => f.id !== id));
    setCustomerInputs(s => {
      const n = { ...s };
      delete n[id];
      return n;
    });
  };

  const updateField = (id, patch) => {
    setFields(s => s.map(f => (f.id === id ? { ...f, ...patch } : f)));
  };

  const addOption = fieldId => {
    setFields(s =>
      s.map(f =>
        f.id === fieldId
          ? {
              ...f,
              options: [
                ...(f.options || []),
                { id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, name: '', price: 0 },
              ],
            }
          : f
      )
    );
  };

  const removeOption = (fieldId, optId) => {
    setFields(s =>
      s.map(f => (f.id === fieldId ? { ...f, options: (f.options || []).filter(o => o.id !== optId) } : f))
    );
  };

  const updateOption = (fieldId, optId, patch) => {
    setFields(s =>
      s.map(f =>
        f.id === fieldId
          ? { ...f, options: (f.options || []).map(o => (o.id === optId ? { ...o, ...patch } : o)) }
          : f
      )
    );
  };

  const validateAdmin = () => {
    const e = {};
    if (!product.name || !product.name.trim()) e.productName = 'Product name is required';
    const labels = fields.map(f => (f.label || '').trim());
    fields.forEach(f => {
      if (!f.label || !f.label.trim()) e[`field-${f.id}-label`] = 'Label required';
      if (labels.filter(l => l === (f.label || '').trim()).length > 1)
        e[`field-${f.id}-label`] = 'Label must be unique within product';
      if (f.type === 'Dropdown') {
        if (!f.options || f.options.length < 2) e[`field-${f.id}-options`] = 'Dropdown requires minimum 2 options';
        const names = (f.options || []).map(o => (o.name || '').trim());
        (f.options || []).forEach(o => {
          if (!o.name || !o.name.trim()) e[`opt-${o.id}`] = 'Option name required';
          if (names.filter(n => n === (o.name || '').trim()).length > 1)
            e[`opt-${o.id}`] = 'Option names must be unique in same field';
          if (o.price === null || o.price === undefined || Number.isNaN(Number(o.price)))
            e[`opt-${o.id}-price`] = 'Option price required';
        });
      }
      if (f.type === 'Text' || f.type === 'Number') {
        if (f.price === null || f.price === undefined || Number.isNaN(Number(f.price)))
          e[`field-${f.id}-price`] = 'Price required';
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const updateCustomerInput = (fieldId, value) => {
    setCustomerInputs(s => ({ ...s, [fieldId]: value }));
  };

  const calcFieldPrice = (field, value) => {
    if (!field) return 0;
    if (field.type === 'Dropdown') {
      const opt = (field.options || []).find(o => String(o.id) === String(value));
      if (!opt) return 0;
      return Number(opt.price || 0);
    }

    if (field.type === 'Number') {
      const v = Number(value || 0);
      if (field.pricingModel === 'Base') return Number(field.price || 0);
      if (field.pricingModel === 'PerUnit') return Number(field.price || 0) * v;
      return 0;
    }

    if (field.type === 'Text') {
      const text = String(value || '');
      if (field.pricingModel === 'Base') return Number(field.price || 0);
      if (field.pricingModel === 'PerChar') return Number(field.price || 0) * text.length;
      return 0;
    }
    return 0;
  };

  const moveField = (index, dir) => {
    setFields(s => {
      const arr = [...s];
      const to = index + dir;
      if (to < 0 || to >= arr.length) return arr;
      const tmp = arr[to];
      arr[to] = arr[index];
      arr[index] = tmp;
      return arr;
    });
  };

  const calcTotalPrice = () => {
    let total = Number(product.basePrice || 0);
    fields.forEach(f => {
      const v = customerInputs[f.id];
      total += calcFieldPrice(f, v);
    });
    return total;
  };
const handleSave = e => {
  e.preventDefault();
  if (!validateAdmin()) return;

  const payload = { product, fields };
  localStorage.setItem('productDemo', JSON.stringify(payload));
  alert('Product saved in localStorage!');
};


  const handleCancel = () => {
    setProduct({ name: '', description: '', basePrice: 0, enableSpecialFields: false });
    setFields([initialField()]);
    setCustomerInputs({});
    setErrors({});
  };


  useEffect(() => {
    setCustomerInputs(prev => {
      const next = { ...prev };
      fields.forEach(f => {
        if (!(f.id in next)) {
          if (f.type === 'Dropdown' && f.options && f.options.length) next[f.id] = f.options[0].id;
          else next[f.id] = f.type === 'Number' ? 0 : '';
        }
      });
      return next;
    });
  }, [fields]);

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm max-w-5xl mx-auto">
      <div className="flex items-start justify-between">

        <h1 className="text-2xl font-semibold mb-4">Product Management</h1>
        <div>


          <button
            type="button"
            onClick={() => {
              setProduct({ name: 'Custom Mug', description: 'A mug with engraving', basePrice: 10 });
              setFields([
                {
                  id: 'f-eg-1',
                  label: 'Engraving Text',
                  type: 'Text',
                  required: true,
                  enableSpecialFields: false,
                  fields: [],
                  pricingModel: 'Base',
                  price: 15,
                  min: 0,
                  max: 50,
                  options: [],
                },
                {
                  id: 'f-eg-2',
                  label: 'Size',
                  type: 'Dropdown',
                  required: true,
                  enableSpecialFields: false,
                  fields: [],
                  pricingModel: null,
                  price: 0,
                  options: [
                    { id: 's', name: 'Small', price: 0 },
                    { id: 'm', name: 'Medium', price: 5 },
                    { id: 'l', name: 'Large', price: 10 },
                  ],
                },
              ]);
            }}
            className="text-sm px-3 py-1 border rounded">
            Load Example
          </button>


        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Configure your product with customizable special fields
      </p>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Info */}
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <h2 className="font-medium mb-2 gap-3">Basic Product Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Product Name *</label>
              <input
                value={product.name}
                onChange={e => setProduct(p => ({ ...p, name: e.target.value }))}
                className="mt-1 block w-full border rounded px-3 py-2 bg-gray-50"
                placeholder="Enter product name"
              />
              {errors.productName && <p className="text-red-600 text-sm mt-1">{errors.productName}</p>}
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium">Product Description</label>
              <textarea
                value={product.description}
                onChange={e => setProduct(p => ({ ...p, description: e.target.value }))}
                rows={3}
                className="mt-1 block w-full border rounded px-3 py-2 bg-gray-50"
                placeholder="Enter product description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Base Price ($) *</label>
              <input
                type="number"
                step="0.01"
                value={product.basePrice}
                onChange={e => setProduct(p => ({ ...p, basePrice: Number(e.target.value) }))}
                className="mt-1 block w-full border rounded px-3 py-2 bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Special Fields */}
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
           <label className="flex items-center gap-2 mb-4">

             <input type="checkbox"
             checked={product.enableSpecialFields}
             onChange={(e) =>
            setProduct({ ...product, enableSpecialFields: e.target.checked }) }
            />
            <span className="text-sm font-medium">Enable Special Fields</span> 
            </label>

              <p className="text-sm text-gray-500">
                Add up to 4 customizable fields to collect additional information and pricing
              </p>
            </div>
          </div>

       {product.enableSpecialFields && (

            <div className="mt-4 space-y-4">
              {fields.map((f, idx) => (
                <div key={f.id} className="border rounded p-3 bg-gray-50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FaGripVertical className="w-5 h-5 text-gray-500" />
                      <h4 className="font-medium">Special Field #{idx + 1}</h4>
                    </div>
                    <button type="button" onClick={() => removeField(f.id)} className="text-red-600 p-2 rounded hover:bg-red-100">
                      <HiTrash className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Field Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                    <div className="md:col-span-2">
                      <label className="block text-sm">Special Field Label *</label>
                      <input
                        value={f.label}
                        onChange={e => updateField(f.id, { label: e.target.value })}
                        className="mt-1 block w-full border rounded px-3 py-2 bg-gray-50"
                        placeholder="e.g., Size, Color, Engraving Text"
                      />
                      {errors[`field-${f.id}-label`] && (
                        <p className="text-red-600 text-sm mt-1">{errors[`field-${f.id}-label`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm">Special Field Type *</label>
                      <select
                        value={f.type}
                        onChange={e =>
                          updateField(f.id, {
                            type: e.target.value,
                            options:
                              e.target.value === 'Dropdown'
                                ? f.options ?? [
                                    { id: `opt-${Date.now()}`, name: '', price: 0 },
                                    { id: `opt-${Date.now() + 1}`, name: '', price: 0 },
                                  ]
                                : [],
                          })
                        }
                        className="mt-1 block w-full border rounded px-3 py-2 gap-4 bg-gray-50"
                      >
                        <option>Text</option>
                        <option>Number</option>
                        <option>Dropdown</option>
                      </select>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="border rounded-lg p-4 bg-white shadow-sm gap-4 mt-4">
                    <label className="block text-sm font-medium mb-2">Pricing Model *</label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`pricing-${f.id}`}
                          value="Base"
                          checked={(f.pricingModel || 'Base') === 'Base'}
                          onChange={() => updateField(f.id, { pricingModel: 'Base' })}
                        />
                        <div>
                          <div className="font-medium text-sm">Base Price(Fixed additional price)</div>
                          <div className="text-xs text-gray-500 font-medium"> Add a fixed price regardless of text length</div>
                        </div>
                      </label>

                      {f.type === 'Text' && (
                        <label className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`pricing-${f.id}`}
                            value="PerChar"
                            checked={f.pricingModel === 'PerChar'}
                            onChange={() => updateField(f.id, { pricingModel: 'PerChar' })}
                          />
                          <div>
                            <div className="font-medium text-sm">Per Character Price (Price * character count)</div>
                            <div className="text-xs text-gray-500"> price is multipliedby the number of character entered </div>
                          </div>
                        </label>
                      )}

                      {f.type === 'Number' && (
                        <label className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`pricing-${f.id}`}
                            value="PerUnit"
                            checked={f.pricingModel === 'PerUnit'}
                            onChange={() => updateField(f.id, { pricingModel: 'PerUnit' })}
                          />
                          <div>
                            <div className="font-medium text-sm">Per Unit</div>
                            <div className="text-xs text-gray-500">Price multiplied by numeric value</div>
                          </div>
                        </label>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-sm font-medium">Base Price ($)*</label>
                        <input
                          type="number"
                          step="0.01"
                          value={f.price ?? 0}
                          onChange={e => updateField(f.id, { price: Number(e.target.value) })}
                          className="w-full border rounded px-3 py-2 mt-1 bg-gray-50"
                        />
                        {errors[`field-${f.id}-price`] && (
                          <p className="text-red-600 text-sm mt-1">{errors[`field-${f.id}-price`]}</p>
                        )}
                      </div>

                      {f.type === 'Text' && (
                        <>
                          <div>
                            <label className="text-sm font-medium">Minimum Length(optional)</label>
                            <input
                              type="number"
                              value={f.min ?? ''}
                              onChange={e => updateField(f.id, { min: e.target.value ? Number(e.target.value) : null })}
                              className="w-full border rounded px-3 py-2 mt-1 bg-gray-50"
                              placeholder="No minimum"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Maximum Length (optional)</label>
                            <input
                              type="number"
                              value={f.max ?? ''}
                              onChange={e => updateField(f.id, { max: e.target.value ? Number(e.target.value) : null })}
                              className="w-full border rounded px-3 py-2 mt-1 bg-gray-50"
                              placeholder="No maximum"
                            />
                          </div>
                        </>
                      )}

                      {f.type === 'Number' && (
                        <>
                          <div>
                            <label className="text-sm font-medium">Min Value</label>
                            <input
                              type="number"
                              value={f.min ?? ''}
                              onChange={e => updateField(f.id, { min: e.target.value ? Number(e.target.value) : null })}
                              className="w-full border rounded px-3 py-2 mt-1 bg-gray-50"
                              placeholder="No minimum"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Max Value</label>
                            <input
                              type="number"
                              value={f.max ?? ''}
                              onChange={e => updateField(f.id, { max: e.target.value ? Number(e.target.value) : null })}
                              className="w-full border rounded px-3 py-2 mt-1 bg-gray-50"
                              placeholder="No maximum"
                            />
                          </div>
                        </>
                      )}
                      
                    </div>
                  </div>

                  {/* Options for Dropdown */}
                  {f.type === 'Dropdown' && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">Options</div>

                        <button
                          type="button"
                          onClick={() => addOption(f.id)}
                          className="px-2 py-1 text-sm border rounded"
                        >
                          + Add Option

                        </button>


 

                      </div>

                      {(f.options || []).map((o, i) => (
                        <div key={o.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center mb-2">
                          <input
                            value={o.name}
                            onChange={e => updateOption(f.id, o.id, { name: e.target.value })}
                            placeholder={`Option ${i + 1} name`}
                            className="border rounded px-3 py-2 bg-gray-50"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={o.price}
                            onChange={e => updateOption(f.id, o.id, { price: Number(e.target.value) })}
                            placeholder="Price"
                            className="border rounded px-3 py-2 bg-gray-50"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(f.id, o.id)}
                            className="text-red-600 px-2 py-1 rounded"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {errors[`field-${f.id}-options`] && (
                        <p className="text-red-600 text-sm">{errors[`field-${f.id}-options`]}</p>
                      )}


              
                    </div>
                  )}

                
                </div>
              ))}
                </div>
                
 )}

         </div>
              <button
              type="button"
              onClick={addField}
              className="px-3 py-1 mt-2 border rounded text-sm bg-gray-100 w-full"
              >
               + Add Special Field({fields.length}/4)

              </button>

          
         
       

        {/* Customer Preview */}
        <div className="border rounded-lg p-4 bg-gray-50 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AiFillEye className="w-5 h-5 text-blue-500" />
            <h3 className="font-medium mb-2">Customer Preview</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            This is how customers will see and interact with the special fields
          </p>

          <div className="border rounded-lg p-4 bg-white shadow-sm">
  <div className="mb-2">
    <div className="font-semibold">{product.name || 'Product Name'}</div>
    <div className="text-sm text-gray-600">Base Price: ${Number(product.basePrice || 0).toFixed(2)}</div>
  </div>

  {fields.map(f => {
    const value = customerInputs[f.id];
    const fieldPrice = calcFieldPrice(f, value ?? (f.type === 'Text' || f.type === 'Number' ? '' : f.options?.[0]?.id));
    return (
      <div key={f.id} className="mb-3">
        

        {f.type === 'Text' && (
          <input
            type="text"
            value={value || ''}
            onChange={e => updateCustomerInput(f.id, e.target.value)}
            className="w-full border rounded px-3 py-2 bg-gray-50"
            placeholder='Enter'
          />
        )}

        {f.type === 'Number' && (
          <input
            type="number"
            value={value || 0}
            onChange={e => updateCustomerInput(f.id, e.target.value)}
            className="w-full border rounded px-3 py-2 bg-gray-50"
          />
        )}

        {f.type === 'Dropdown' && (
          <select
            value={value || f.options?.[0]?.id}
            onChange={e => updateCustomerInput(f.id, e.target.value)}
            className="w-full border rounded px-3 py-2 bg-gray-50"
          >
            {f.options?.map(o => (
              <option key={o.id} value={o.id}>
                {o.name} {o.price ? `(+${o.price})` : ''}
              </option>
            ))}
          </select>
        )}
          

           <div className="w-full h-px bg-gray-300 gap-3"></div>
           
        <div className="flex justify-between items-center mb-1 gap-3">
          <div>{f.label || 'Base Price :'}</div>
          <div className="text-sm text-gray-600">${fieldPrice.toFixed(2)}</div>
        </div>
      </div>
    );
  })}

  <div className="w-full h-px bg-gray-300 gap-3"></div>

  <div className="flex justify-between items-center mt-4 font-semibold">
    <div>Total Price:</div>
    <div>${calcTotalPrice().toFixed(2)}</div>
  </div>



 </div>
  </div>
           
         <div className="flex justify-end gap-3 mt-4">
        <button
          type="button"
          className="px-4 py-2 border rounded bg-gray-100"
          onClick={handleCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-black text-white border rounded"
          
        >
          Save Product
        </button>
      </div>
       
      </form>
    </div>
  );
}
