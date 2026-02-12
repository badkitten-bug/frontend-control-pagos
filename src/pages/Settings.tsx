import { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, Upload, Save, Building2 } from 'lucide-react';
import { settingsService, CompanySettings } from '../services/settings.service';
import { Button, Input } from '../components/ui';
import toast from 'react-hot-toast';

export function Settings() {
  const [settings, setSettings] = useState<CompanySettings>({
    empresa_nombre: '',
    empresa_ruc: '',
    empresa_direccion: '',
    empresa_telefono: '',
    empresa_email: '',
    empresa_logo: '',
    recibo_mensaje: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsService.getAll();
      setSettings(data);
      if (data.empresa_logo) {
        setLogoPreview(settingsService.getLogoUrl(data.empresa_logo));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof CompanySettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await settingsService.save(settings);
      toast.success('Configuración guardada');
    } catch (error) {
      toast.error('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    try {
      const result = await settingsService.uploadLogo(file);
      setSettings(prev => ({ ...prev, empresa_logo: result.path }));
      toast.success('Logo subido correctamente');
    } catch (error) {
      toast.error('Error al subir logo');
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-slate-400">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            Configuración
          </h1>
          <p className="text-slate-400">Configura los datos de tu empresa</p>
        </div>
        <Button onClick={handleSave} isLoading={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logo Section */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Logo de la Empresa
          </h2>
          
          <div className="flex flex-col items-center gap-4">
            <div 
              className="w-40 h-40 rounded-xl bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-slate-400">
                  <Upload className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Click para subir</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <p className="text-xs text-slate-400">PNG, JPG o GIF. Máx 5MB</p>
          </div>
        </div>

        {/* Company Info */}
        <div className="lg:col-span-2 glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Datos de la Empresa
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre de la Empresa"
              value={settings.empresa_nombre}
              onChange={(e) => handleChange('empresa_nombre', e.target.value)}
              placeholder="Mi Empresa S.A.C."
            />
            <Input
              label="RUC"
              value={settings.empresa_ruc}
              onChange={(e) => handleChange('empresa_ruc', e.target.value)}
              placeholder="20123456789"
            />
            <Input
              label="Teléfono"
              value={settings.empresa_telefono}
              onChange={(e) => handleChange('empresa_telefono', e.target.value)}
              placeholder="999 999 999"
            />
            <Input
              label="Email"
              type="email"
              value={settings.empresa_email}
              onChange={(e) => handleChange('empresa_email', e.target.value)}
              placeholder="contacto@empresa.com"
            />
            <div className="md:col-span-2">
              <Input
                label="Dirección"
                value={settings.empresa_direccion}
                onChange={(e) => handleChange('empresa_direccion', e.target.value)}
                placeholder="Av. Principal 123, Lima"
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Mensaje del Recibo"
                value={settings.recibo_mensaje}
                onChange={(e) => handleChange('recibo_mensaje', e.target.value)}
                placeholder="Gracias por su pago"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
