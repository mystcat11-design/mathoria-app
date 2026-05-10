import { useState, useEffect } from 'react';
import { Award, Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export interface CustomBadge {
  name: string;
  icon: string;
  color: string;
  description: string;
}

interface BadgeManagerProps {
  onClose: () => void;
}

export function BadgeManager({ onClose }: BadgeManagerProps) {
  const [badges, setBadges] = useState<CustomBadge[]>([]);
  const [editingBadge, setEditingBadge] = useState<CustomBadge | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CustomBadge>({
    name: '',
    icon: '🏅',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    description: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('mathIRT_customBadges');
    if (saved) {
      setBadges(JSON.parse(saved));
    }
  }, []);

  const saveBadges = (updatedBadges: CustomBadge[]) => {
    localStorage.setItem('mathIRT_customBadges', JSON.stringify(updatedBadges));
    setBadges(updatedBadges);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error('Nama dan deskripsi harus diisi!');
      return;
    }

    if (editingBadge) {
      // Update existing
      const updated = badges.map(b =>
        b.name === editingBadge.name ? formData : b
      );
      saveBadges(updated);
      toast.success('✅ Badge berhasil diperbarui!');
    } else {
      // Create new
      if (badges.some(b => b.name === formData.name)) {
        toast.error('Nama badge sudah ada!');
        return;
      }
      saveBadges([...badges, formData]);
      toast.success('✅ Badge baru berhasil ditambahkan!');
    }

    resetForm();
  };

  const handleDelete = (badgeName: string) => {
    if (confirm(`Yakin ingin menghapus badge "${badgeName}"?`)) {
      const updated = badges.filter(b => b.name !== badgeName);
      saveBadges(updated);
      toast.success('✅ Badge berhasil dihapus!');
    }
  };

  const handleEdit = (badge: CustomBadge) => {
    setEditingBadge(badge);
    setFormData({ ...badge });
    setIsCreating(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      icon: '🏅',
      color: 'bg-blue-100 text-blue-700 border-blue-300',
      description: ''
    });
    setEditingBadge(null);
    setIsCreating(false);
  };

  const colorOptions = [
    { label: 'Biru', value: 'bg-blue-100 text-blue-700 border-blue-300' },
    { label: 'Ungu', value: 'bg-purple-100 text-purple-700 border-purple-300' },
    { label: 'Hijau', value: 'bg-green-100 text-green-700 border-green-300' },
    { label: 'Kuning', value: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    { label: 'Merah', value: 'bg-red-100 text-red-700 border-red-300' },
    { label: 'Orange', value: 'bg-orange-100 text-orange-700 border-orange-300' },
    { label: 'Pink', value: 'bg-pink-100 text-pink-700 border-pink-300' },
    { label: 'Indigo', value: 'bg-indigo-100 text-indigo-700 border-indigo-300' },
    { label: 'Teal', value: 'bg-teal-100 text-teal-700 border-teal-300' },
    { label: 'Cyan', value: 'bg-cyan-100 text-cyan-700 border-cyan-300' },
  ];

  const commonIcons = ['🏅', '🏆', '⭐', '✨', '🎯', '🔥', '💎', '👑', '🌟', '⚡', '💯', '🎓', '🚀', '🧠', '💪', '🎨', '📚', '🔢', '📐', '🧮'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Kelola Badge</h2>
              <p className="text-purple-100 mt-1">Buat dan edit achievement sesuai kebutuhan</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Add New Button */}
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full mb-6 p-4 border-2 border-dashed border-purple-300 rounded-xl hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 text-purple-600 font-semibold"
            >
              <Plus className="w-5 h-5" />
              Tambah Badge Baru
            </button>
          )}

          {/* Form */}
          {isCreating && (
            <div className="mb-6 bg-purple-50 border-2 border-purple-300 rounded-xl p-6">
              <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                {editingBadge ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingBadge ? 'Edit Badge' : 'Badge Baru'}
              </h3>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Nama Badge <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Misal: Master Aljabar"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Icon */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Icon Badge
                  </label>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {commonIcons.map(icon => (
                      <button
                        key={icon}
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`w-12 h-12 rounded-lg border-2 text-2xl hover:scale-110 transition-transform ${
                          formData.icon === icon ? 'border-purple-500 bg-purple-100' : 'border-gray-300'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="Atau masukkan emoji manual"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    maxLength={2}
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Warna Badge
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {colorOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setFormData({ ...formData, color: option.value })}
                        className={`${option.value} border-2 rounded-lg px-3 py-2 text-xs font-semibold transition-transform hover:scale-105 ${
                          formData.color === option.value ? 'ring-2 ring-purple-500' : ''
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Deskripsi <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Misal: Menguasai semua soal aljabar dasar"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Preview</label>
                  <div className={`${formData.color} border-2 rounded-lg px-4 py-3 inline-flex items-center gap-2`}>
                    <span className="text-2xl">{formData.icon}</span>
                    <div>
                      <p className="font-semibold text-sm">{formData.name || 'Nama Badge'}</p>
                      <p className="text-xs opacity-80">{formData.description || 'Deskripsi badge'}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingBadge ? 'Update Badge' : 'Tambah Badge'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Badge List */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              Badge Custom ({badges.length})
            </h3>

            {badges.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Award className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p>Belum ada badge custom</p>
                <p className="text-sm mt-1">Klik "Tambah Badge Baru" untuk membuat badge</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {badges.map(badge => (
                  <div
                    key={badge.name}
                    className={`${badge.color} border-2 rounded-lg px-4 py-3 relative group hover:shadow-lg transition-shadow`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-2xl">{badge.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{badge.name}</p>
                        <p className="text-xs opacity-80 line-clamp-2">{badge.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleEdit(badge)}
                        className="flex-1 px-3 py-1 bg-white/50 hover:bg-white/80 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(badge.name)}
                        className="flex-1 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-700 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
