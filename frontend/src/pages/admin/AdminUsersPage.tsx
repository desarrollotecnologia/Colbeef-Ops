import { FormEvent, useEffect, useState } from 'react';
import { Users, Plus, KeyRound, Pencil, X } from 'lucide-react';
import api from '@/lib/api';
import Layout from '@/components/Layout';
import Card, { CardBody } from '@/components/Card';
import Button from '@/components/Button';

interface FormatCatalogItem {
  id: string;
  code: string;
  name: string;
  documentCode?: string;
}

interface ManagedUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'OPERARIO';
  active: boolean;
  formatIds: string[];
  formats: { id: string; code: string; name: string }[];
}

type EditorMode = 'create' | 'edit' | null;

const emptyForm = {
  username: '',
  password: '',
  fullName: '',
  email: '',
  role: 'OPERARIO' as 'ADMIN' | 'OPERARIO',
  active: true,
  formatIds: [] as string[],
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [catalog, setCatalog] = useState<FormatCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<EditorMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [passwordUser, setPasswordUser] = useState<ManagedUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [usersRes, formatsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/users/formats-catalog'),
      ]);
      setUsers(usersRes.data);
      setCatalog(formatsRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setMode('create');
    setEditingId(null);
    setForm({ ...emptyForm, formatIds: catalog.map((f) => f.id) });
    setError('');
  };

  const openEdit = (u: ManagedUser) => {
    setMode('edit');
    setEditingId(u.id);
    setForm({
      username: u.username,
      password: '',
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      active: u.active,
      formatIds: [...u.formatIds],
    });
    setError('');
  };

  const closeEditor = () => {
    setMode(null);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  const toggleFormat = (formatId: string) => {
    setForm((prev) => ({
      ...prev,
      formatIds: prev.formatIds.includes(formatId)
        ? prev.formatIds.filter((id) => id !== formatId)
        : [...prev.formatIds, formatId],
    }));
  };

  const selectAllFormats = () => {
    setForm((prev) => ({ ...prev, formatIds: catalog.map((f) => f.id) }));
  };

  const clearFormats = () => {
    setForm((prev) => ({ ...prev, formatIds: [] }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (mode === 'create') {
        await api.post('/admin/users', {
          username: form.username,
          password: form.password,
          fullName: form.fullName,
          email: form.email || undefined,
          role: form.role,
          active: form.active,
          formatIds: form.role === 'OPERARIO' ? form.formatIds : [],
        });
      } else if (editingId) {
        await api.patch(`/admin/users/${editingId}`, {
          fullName: form.fullName,
          email: form.email || undefined,
          role: form.role,
          active: form.active,
          formatIds: form.role === 'OPERARIO' ? form.formatIds : undefined,
        });
      }
      closeEditor();
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'No se pudo guardar el usuario';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordUser) return;
    setSaving(true);
    setError('');
    try {
      await api.patch(`/admin/users/${passwordUser.id}/password`, { password: newPassword });
      setPasswordUser(null);
      setNewPassword('');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'No se pudo actualizar la contraseña';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users size={28} /> Usuarios
          </h1>
          <p className="text-gray-500 mt-1">
            Cree operarios, asigne formatos y active o desactive cuentas
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={18} /> Nuevo usuario
        </Button>
      </div>

      {error && !mode && !passwordUser && (
        <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>
      )}

      <div className="space-y-3">
        {users.map((u) => (
          <Card key={u.id}>
            <CardBody className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{u.fullName}</h3>
                  <span className="text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full">
                    {u.role === 'ADMIN' ? 'Admin' : 'Operario'}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      u.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {u.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  @{u.username}
                  {u.email ? ` · ${u.email}` : ''}
                </p>
                {u.role === 'OPERARIO' && (
                  <p className="text-xs text-gray-500 mt-2">
                    {u.formatIds.length === 0
                      ? 'Sin formatos asignados'
                      : `${u.formatIds.length} formato(s): ${u.formats
                          .slice(0, 4)
                          .map((f) => f.code)
                          .join(', ')}${u.formats.length > 4 ? '…' : ''}`}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                  <Pencil size={16} /> Editar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setPasswordUser(u);
                    setNewPassword('');
                    setError('');
                  }}
                >
                  <KeyRound size={16} /> Clave
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {mode && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">
                {mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'}
              </h2>
              <button type="button" onClick={closeEditor} className="p-2 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
              )}
              {mode === 'create' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                    <input
                      required
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <input
                      required
                      type="password"
                      minLength={6}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                      autoComplete="new-password"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo (opcional)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value as 'ADMIN' | 'OPERARIO' })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="OPERARIO">Operario</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setForm({ ...form, active: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    Cuenta activa
                  </label>
                </div>
              </div>

              {form.role === 'OPERARIO' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Formatos permitidos</label>
                    <div className="flex gap-2 text-xs">
                      <button type="button" className="text-primary-600 hover:underline" onClick={selectAllFormats}>
                        Todos
                      </button>
                      <button type="button" className="text-gray-500 hover:underline" onClick={clearFormats}>
                        Ninguno
                      </button>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y">
                    {catalog.map((f) => (
                      <label
                        key={f.id}
                        className="flex items-start gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={form.formatIds.includes(f.id)}
                          onChange={() => toggleFormat(f.id)}
                          className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span>
                          <span className="font-medium text-gray-800">{f.code}</span>
                          <span className="block text-gray-500 text-xs">{f.name}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeEditor}>
                  Cancelar
                </Button>
                <Button type="submit" loading={saving}>
                  Guardar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {passwordUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md sm:rounded-xl shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-lg font-semibold">Cambiar contraseña</h2>
              <button
                type="button"
                onClick={() => setPasswordUser(null)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePassword} className="p-5 space-y-4">
              <p className="text-sm text-gray-600">
                Nueva clave para <strong>{passwordUser.fullName}</strong> (@{passwordUser.username})
              </p>
              {error && (
                <div className="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
              )}
              <input
                required
                type="password"
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                autoComplete="new-password"
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setPasswordUser(null)}>
                  Cancelar
                </Button>
                <Button type="submit" loading={saving}>
                  Actualizar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
