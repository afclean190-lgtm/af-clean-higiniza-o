import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Settings as SettingsIcon, 
  Plus, 
  Camera, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  MessageCircle,
  Trash2,
  Edit2,
  Moon,
  Sun,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  TrendingUp,
  TrendingDown,
  X,
  Save,
  PenTool,
  FileText,
  Share2,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  addMonths, 
  isAfter, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  subMonths,
  isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import SignatureCanvas from 'react-signature-canvas';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from './types';
import type { Appointment, Financial, Settings } from './types';

// Components
const Navbar = ({ activeTab, setActiveTab, theme, toggleTheme }: any) => {
  const tabs = [
    { id: 'dashboard', icon: TrendingUp, label: 'Painel' },
    { id: 'agenda', icon: Calendar, label: 'Agenda' },
    { id: 'financial', icon: DollarSign, label: 'Financeiro' },
    { id: 'settings', icon: SettingsIcon, label: 'Ajustes' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass z-50 px-4 py-2 md:top-0 md:bottom-auto md:flex md:justify-between md:items-center">
      <div className="hidden md:flex items-center gap-2 font-bold text-xl text-primary">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">AF</div>
        AF CLEAN
      </div>
      <div className="flex justify-around md:gap-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1 p-2 transition-all",
              activeTab === tab.id ? "text-primary scale-110" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <tab.icon size={24} />
            <span className="text-[10px] font-medium uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
        <button onClick={toggleTheme} className="p-2 text-slate-400">
          {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </div>
    </nav>
  );
};

const AppointmentCard = ({ appointment, onEdit, onDelete, onStart, onGenerateInvoice }: any) => {
  const isCompleted = appointment.status === 'completed';
  const isInProgress = appointment.status === 'in_progress';

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-4 rounded-2xl mb-4 relative overflow-hidden"
    >
      <div className={cn(
        "absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase rounded-bl-xl",
        isCompleted ? "bg-emerald-500 text-white" : isInProgress ? "bg-blue-500 text-white" : "bg-amber-500 text-white"
      )}>
        {appointment.status === 'pending' ? 'Pendente' : appointment.status === 'in_progress' ? 'Em Curso' : 'Concluído'}
      </div>

      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg">{appointment.customer_name}</h3>
        <div className="flex gap-2">
          {isCompleted && (
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const text = `*AF CLEAN - NOTA FISCAL*%0A%0A*Cliente:* ${appointment.customer_name}%0A*Serviço:* ${appointment.service_type || 'Limpeza'}%0A*Data:* ${format(parseISO(appointment.date), 'dd/MM/yyyy')}%0A*Valor:* R$ ${appointment.price.toFixed(2)}%0A%0A_Obrigado pela preferência!_`;
                window.open(`https://wa.me/55${appointment.phone.replace(/\D/g, '')}?text=${text}`, '_blank');
              }} 
              className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-full transition-colors relative z-10"
              title="Enviar Comprovante via WhatsApp"
            >
              <Share2 size={18} />
            </button>
          )}
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(appointment);
            }} 
            className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors relative z-10"
          >
            <Edit2 size={18} />
          </button>
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Delete button clicked for ID:', appointment.id);
              onDelete(appointment.id);
            }} 
            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors relative z-10"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-primary" />
          {format(parseISO(appointment.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-primary" />
          <a 
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appointment.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {appointment.address}
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Phone size={16} className="text-primary" />
          {appointment.phone}
          <a 
            href={`https://wa.me/55${appointment.phone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 p-1 bg-emerald-100 text-emerald-600 rounded-full"
          >
            <MessageCircle size={14} />
          </a>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {!isCompleted && (
          <button 
            onClick={() => onStart(appointment)}
            className="flex-1 btn-primary"
          >
            {isInProgress ? 'Continuar Serviço' : 'Iniciar Serviço'}
            <ChevronRight size={18} />
          </button>
        )}
        {isCompleted && (
          <div className="flex-1 flex gap-2">
            <div className="flex-1 text-center py-2 bg-emerald-50 text-emerald-600 rounded-xl font-medium text-sm flex items-center justify-center gap-2">
              <CheckCircle2 size={18} /> Serviço Finalizado
            </div>
            <button 
              onClick={() => onGenerateInvoice(appointment)}
              className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2 px-4 text-sm font-bold"
            >
              <FileText size={18} /> PDF
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [financials, setFinancials] = useState<Financial[]>([]);
  const [settings, setSettings] = useState<Settings>({});
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Partial<Appointment> | null>(null);
  const [activeService, setActiveService] = useState<Appointment | null>(null);
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [newFinancial, setNewFinancial] = useState<Partial<Financial>>({ type: 'income', date: new Date().toISOString().split('T')[0] });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const sigCanvas = React.useRef<SignatureCanvas>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) setLoadingTimeout(true);
    }, 10000);

    const checkHealthAndFetch = async () => {
      console.log('Frontend: Checking server health...');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const res = await fetch('/health', { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (res.ok) {
          console.log('Frontend: Server is healthy, fetching data...');
          fetchData();
        } else {
          throw new Error('Server starting...');
        }
      } catch (e) {
        console.log('Frontend: Server not ready or timeout, retrying health check...');
        setTimeout(checkHealthAndFetch, 2000);
      }
    };

    checkHealthAndFetch();
    
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
    
    return () => clearTimeout(timer);
  }, []);

  const fetchData = async (retries = 3) => {
    console.log(`Frontend: Starting fetchData (attempt ${4 - retries})...`);
    setIsLoading(true);
    try {
      const fetchWithCheck = async (url: string) => {
        console.log(`Frontend: Fetching ${url}...`);
        const res = await fetch(url);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Erro ao carregar ${url}: ${res.status} ${text.substring(0, 50)}`);
        }
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Resposta inválida de ${url}: Esperava JSON, recebeu ${contentType}`);
        }
        return res.json();
      };

      const [appts, fins, sets] = await Promise.all([
        fetchWithCheck('/api/appointments'),
        fetchWithCheck('/api/financials'),
        fetchWithCheck('/api/settings'),
      ]);
      
      console.log('Frontend: Data fetched successfully:', { 
        apptsCount: appts.length, 
        finsCount: fins.length
      });

      const parsedAppts = appts.map((a: any) => ({
        ...a,
        before_photos: JSON.parse(a.before_photos || '[]'),
        after_photos: JSON.parse(a.after_photos || '[]'),
      }));
      
      setAppointments(parsedAppts);
      setFinancials(fins);
      setSettings(sets);
      setConnectionError(null);
      setIsLoading(false); // Clear loading on success
    } catch (error: any) {
      console.error('Frontend: FetchData error:', error);
      if (retries > 0) {
        console.log('Frontend: Retrying in 2 seconds...');
        setTimeout(() => fetchData(retries - 1), 2000);
      } else {
        setConnectionError(error.message);
        setIsLoading(false); // Clear loading on final failure
      }
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingAppointment?.id ? 'PATCH' : 'POST';
    const url = editingAppointment?.id ? `/api/appointments/${editingAppointment.id}` : '/api/appointments';
    
    console.log(`Frontend: Saving appointment via ${method} ${url}`, editingAppointment);

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAppointment),
      });
      
      if (!response.ok) {
        const text = await response.text();
        let errorMessage = 'Erro no servidor';
        try {
          const err = JSON.parse(text);
          errorMessage = err.error || errorMessage;
        } catch (e) {
          errorMessage = text.substring(0, 100) || `Erro HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }
      
      setIsModalOpen(false);
      setEditingAppointment(null);
      fetchData();
    } catch (error: any) {
      console.error('Frontend: Save appointment error:', error);
      alert('Erro ao salvar: ' + error.message);
    }
  };

  const handleDeleteAppointment = async (id: number) => {
    console.log('Frontend: Attempting to delete appointment', id);
    if (id === undefined || id === null) {
      console.error('Frontend: No ID provided');
      return;
    }
    
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      try {
        const response = await fetch(`/api/appointments/${id}`, { 
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        console.log('Frontend: Delete response:', result);
        
        if (result.success) {
          if (result.changes === 0) {
            console.warn('Frontend: No record was deleted in the database.');
          }
          setAppointments(prev => prev.filter(a => a.id !== id));
          await fetchData();
        } else {
          alert('Erro ao excluir: ' + (result.error || 'Erro no servidor'));
        }
      } catch (error) {
        console.error('Frontend: Delete error:', error);
        alert('Erro de conexão ao excluir.');
      }
    }
  };

  const handleSaveFinancial = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = newFinancial.id ? 'PATCH' : 'POST';
    const url = newFinancial.id ? `/api/financials/${newFinancial.id}` : '/api/financials';
    
    console.log(`Frontend: Saving financial via ${method} ${url}`, newFinancial);

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFinancial),
      });
      
      if (!response.ok) {
        const text = await response.text();
        let errorMessage = 'Erro no servidor';
        try {
          const err = JSON.parse(text);
          errorMessage = err.error || errorMessage;
        } catch (e) {
          errorMessage = text.substring(0, 100) || `Erro HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }
      
      setIsFinancialModalOpen(false);
      setNewFinancial({ type: 'income', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (error: any) {
      console.error('Frontend: Save financial error:', error);
      alert('Erro ao salvar: ' + error.message);
    }
  };

  const handleDeleteFinancial = async (id: number) => {
    console.log('Frontend: Attempting to delete financial', id);
    if (id === undefined || id === null) return;

    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      try {
        const response = await fetch(`/api/financials/${id}`, { 
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        console.log('Frontend: Delete response:', result);

        if (response.ok && result.success) {
          if (result.changes === 0) {
            console.warn('Frontend: No record was deleted in the database.');
          }
          setFinancials(prev => prev.filter(f => f.id !== id));
          await fetchData();
        } else {
          alert('Erro ao excluir: ' + (result.error || 'Erro no servidor'));
        }
      } catch (error) {
        console.error('Frontend: Delete error:', error);
        alert('Erro de conexão ao excluir.');
      }
    }
  };

  const handlePhotoCapture = async (type: 'before' | 'after') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        if (activeService) {
          const currentPhotos = type === 'before' ? activeService.before_photos : activeService.after_photos;
          const newPhotos = [...currentPhotos, base64];
          
          const update: any = { status: 'in_progress' };
          if (type === 'before') {
            update.before_photos = JSON.stringify(newPhotos);
          } else {
            update.after_photos = JSON.stringify(newPhotos);
          }

          await fetch(`/api/appointments/${activeService.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(update),
          });

          const updatedService = { 
            ...activeService, 
            status: 'in_progress',
            [type === 'before' ? 'before_photos' : 'after_photos']: newPhotos 
          } as Appointment;
          
          setActiveService(updatedService);
          fetchData();
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleRemovePhoto = async (type: 'before' | 'after', index: number) => {
    if (!activeService) return;
    
    const currentPhotos = type === 'before' ? activeService.before_photos : activeService.after_photos;
    const newPhotos = currentPhotos.filter((_, i) => i !== index);
    
    const update: any = {};
    if (type === 'before') {
      update.before_photos = JSON.stringify(newPhotos);
    } else {
      update.after_photos = JSON.stringify(newPhotos);
    }

    await fetch(`/api/appointments/${activeService.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });

    const updatedService = { 
      ...activeService, 
      [type === 'before' ? 'before_photos' : 'after_photos']: newPhotos 
    } as Appointment;
    
    setActiveService(updatedService);
    fetchData();
  };

  const handleFinalizeService = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      alert('Por favor, peça ao cliente para assinar.');
      return;
    }

    // Use getCanvas() instead of getTrimmedCanvas() to avoid the "import_trim_canvas.default is not a function" error
    const signature = sigCanvas.current.getCanvas().toDataURL('image/png');
    if (activeService) {
      await fetch(`/api/appointments/${activeService.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          signature, 
          status: 'completed',
          price: activeService.price,
          payment_method: activeService.payment_method,
          installments: activeService.installments
        }),
      });
      
      // Add to financials
      await fetch('/api/financials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'income',
          description: `Limpeza: ${activeService.customer_name}`,
          amount: activeService.price,
          date: new Date().toISOString().split('T')[0]
        }),
      });

      setActiveService(null);
      fetchData();
      alert('Serviço finalizado com sucesso!');
    }
  };

  const handleGenerateInvoice = (appointment: Appointment) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129); // emerald-500
    doc.text(`${(settings.company_name || 'AF CLEAN').toUpperCase()} - NOTA FISCAL`, 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Data de Emissão: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);
    doc.text(`Nº do Serviço: ${appointment.id}`, 14, 35);

    // Company Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('PRESTADOR DE SERVIÇO:', 14, 50);
    doc.setFontSize(10);
    doc.text(`${settings.company_name || 'AF CLEAN'} Serviços de Limpeza`, 14, 56);
    doc.text('CNPJ: 00.000.000/0001-00', 14, 61);
    doc.text('Telefone: (11) 99999-9999', 14, 66);

    // Customer Info
    doc.setFontSize(12);
    doc.text('CLIENTE:', 120, 50);
    doc.setFontSize(10);
    doc.text(appointment.customer_name, 120, 56);
    doc.text(`Telefone: ${appointment.phone}`, 120, 61);
    doc.text(`Endereço: ${appointment.address}`, 120, 66, { maxWidth: 80 });

    // Table
    autoTable(doc, {
      startY: 85,
      head: [['Descrição do Serviço', 'Data', 'Valor']],
      body: [
        [
          appointment.service_type || 'Serviço de Limpeza Geral',
          format(parseISO(appointment.date), 'dd/MM/yyyy'),
          `R$ ${appointment.price.toFixed(2)}`
        ]
      ],
      headStyles: { fillColor: [16, 185, 129] },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 100;

    // Total
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`VALOR TOTAL: R$ ${appointment.price.toFixed(2)}`, 140, finalY + 20);

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text('Obrigado pela preferência! AF CLEAN - Qualidade em primeiro lugar.', pageWidth / 2, 280, { align: 'center' });

    // Save
    doc.save(`Nota_Fiscal_AF_CLEAN_${appointment.customer_name.replace(/\s+/g, '_')}.pdf`);
  };

  const handleClearFinancials = async () => {
    if (window.confirm('Tem certeza que deseja excluir TODO o histórico financeiro? Esta ação não pode ser desfeita.')) {
      try {
        const response = await fetch('/api/financials', { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
          fetchData();
        } else {
          alert('Erro ao limpar histórico: ' + (result.error || 'Erro desconhecido'));
        }
      } catch (error) {
        console.error('Error clearing financials:', error);
        alert('Erro de conexão ao limpar histórico.');
      }
    }
  };

  const handleUpdateLogo = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'logo', value: base64 }),
        });
        fetchData();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleUpdateCompanyName = async (name: string) => {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'company_name', value: name }),
    });
    fetchData();
  };

  const stats = {
    totalIncome: financials.filter(f => f.type === 'income').reduce((acc, f) => acc + f.amount, 0),
    totalExpense: financials.filter(f => f.type === 'expense').reduce((acc, f) => acc + f.amount, 0),
    pendingJobs: appointments.filter(a => a.status !== 'completed').length,
  };

  const nextAppointment = [...appointments]
    .filter(a => a.status !== 'completed')
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())[0];

  return (
    <div className="min-h-screen pb-24 md:pt-20">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} toggleTheme={toggleTheme} />

      {isLoading && !connectionError && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-white/20 flex flex-col items-center gap-6 max-w-xs w-full text-center"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sincronizando Dados</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Estamos preparando tudo para você começar.</p>
            </div>

            {loadingTimeout && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} /> Forçar Recarregamento
              </motion.button>
            )}
          </motion.div>
        </div>
      )}

      {connectionError && (
        <div className="max-w-4xl mx-auto p-4 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
            <X size={20} className="shrink-0" />
            <div className="text-sm">
              <p className="font-bold">Erro de Conexão</p>
              <p>{connectionError}</p>
            </div>
            <button 
              onClick={() => fetchData()}
              className="ml-auto bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto p-4">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight uppercase">OLÁ, {settings.company_name || 'AF CLEAN'}</h1>
                <p className="text-slate-500">Gestão de hoje: {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-primary">
                {settings.logo ? (
                  <img src={settings.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center text-white font-bold">
                    {(settings.company_name || 'AF').substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            </header>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass p-4 rounded-3xl bg-emerald-500 text-white">
                <div className="flex justify-between items-start mb-2">
                  <TrendingUp size={24} />
                  <span className="text-[10px] font-bold uppercase opacity-80">Lucro Total</span>
                </div>
                <div className="text-2xl font-black">R$ {(stats.totalIncome - stats.totalExpense).toFixed(2)}</div>
              </div>
              <div className="glass p-4 rounded-3xl bg-amber-500 text-white">
                <div className="flex justify-between items-start mb-2">
                  <Clock size={24} />
                  <span className="text-[10px] font-bold uppercase opacity-80">Pendentes</span>
                </div>
                <div className="text-2xl font-black">{stats.pendingJobs}</div>
              </div>
            </div>

            {nextAppointment && (
              <motion.section 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden glass p-6 rounded-[2rem] bg-gradient-to-br from-primary to-emerald-600 text-white shadow-xl shadow-primary/20"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                  <Calendar size={120} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider">
                      Destaque: Próximo Serviço
                    </span>
                    {nextAppointment.status === 'in_progress' && (
                      <span className="px-3 py-1 bg-blue-500/40 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">
                        Em Curso
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-black mb-1">{nextAppointment.customer_name}</h2>
                  <div className="flex flex-wrap gap-4 text-sm opacity-90 mb-6">
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      {format(parseISO(nextAppointment.date), "HH:mm")}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      {format(parseISO(nextAppointment.date), "dd 'de' MMMM", { locale: ptBR })}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={16} />
                      <span className="truncate max-w-[150px]">{nextAppointment.address}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveService(nextAppointment)}
                    className="w-full py-3 bg-white text-primary font-bold rounded-2xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                    {nextAppointment.status === 'in_progress' ? 'Continuar Serviço' : 'Iniciar Agora'}
                    <ChevronRight size={18} />
                  </button>
                </div>
              </motion.section>
            )}

            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Próximos Serviços</h2>
                <button onClick={() => { setEditingAppointment({ date: new Date().toISOString().slice(0, 16) }); setIsModalOpen(true); }} className="text-primary font-bold flex items-center gap-1">
                  <Plus size={20} /> Novo
                </button>
              </div>
              {appointments.filter(a => a.status !== 'completed').slice(0, 3).map(appt => (
                <AppointmentCard 
                  key={appt.id} 
                  appointment={appt} 
                  onEdit={(a: any) => { setEditingAppointment(a); setIsModalOpen(true); }}
                  onDelete={handleDeleteAppointment}
                  onStart={setActiveService}
                  onGenerateInvoice={handleGenerateInvoice}
                />
              ))}
              {appointments.filter(a => a.status !== 'completed').length === 0 && (
                <div className="text-center py-12 glass rounded-3xl text-slate-400">
                  <Calendar size={48} className="mx-auto mb-2 opacity-20" />
                  Nenhum serviço pendente
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'agenda' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Agenda</h1>
              <button onClick={() => { setEditingAppointment({ date: new Date().toISOString().slice(0, 16) }); setIsModalOpen(true); }} className="btn-primary">
                <Plus size={20} /> Agendar
              </button>
            </div>

            {/* Calendar Component */}
            <div className="glass rounded-3xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                  <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const monthStart = startOfMonth(currentMonth);
                  const monthEnd = endOfMonth(monthStart);
                  const startDate = startOfWeek(monthStart);
                  const endDate = endOfWeek(monthEnd);
                  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

                  return calendarDays.map((day, idx) => {
                    const dayAppointments = appointments.filter(a => isSameDay(parseISO(a.date), day));
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          "relative aspect-square flex flex-col items-center justify-center rounded-xl transition-all text-sm",
                          !isCurrentMonth && "opacity-20",
                          isSelected ? "bg-primary text-white shadow-lg shadow-primary/30" : "hover:bg-slate-100 dark:hover:bg-slate-800",
                          isToday(day) && !isSelected && "border border-primary/30 text-primary font-bold"
                        )}
                      >
                        <span>{format(day, 'd')}</span>
                        <div className="flex gap-0.5 mt-1">
                          {dayAppointments.some(a => a.status === 'pending') && (
                            <div className={cn("w-1 h-1 rounded-full", isSelected ? "bg-white" : "bg-amber-500")} />
                          )}
                          {dayAppointments.some(a => a.status === 'in_progress') && (
                            <div className={cn("w-1 h-1 rounded-full", isSelected ? "bg-white" : "bg-blue-500")} />
                          )}
                          {dayAppointments.some(a => a.status === 'completed') && (
                            <div className={cn("w-1 h-1 rounded-full", isSelected ? "bg-white" : "bg-emerald-500")} />
                          )}
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Selected Day Appointments */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-500 uppercase text-xs tracking-widest">
                  {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : 'Selecione um dia'}
                </h3>
                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-slate-500">
                  {appointments.filter(a => selectedDate && isSameDay(parseISO(a.date), selectedDate)).length} Serviços
                </span>
              </div>

              {appointments
                .filter(a => selectedDate && isSameDay(parseISO(a.date), selectedDate))
                .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
                .map(appt => (
                  <AppointmentCard 
                    key={appt.id} 
                    appointment={appt} 
                    onEdit={(a: any) => { setEditingAppointment(a); setIsModalOpen(true); }}
                    onDelete={handleDeleteAppointment}
                    onStart={setActiveService}
                    onGenerateInvoice={handleGenerateInvoice}
                  />
                ))}

              {selectedDate && appointments.filter(a => isSameDay(parseISO(a.date), selectedDate)).length === 0 && (
                <div className="text-center py-12 glass rounded-3xl text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800">
                  <Clock size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Nenhum serviço para este dia</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Financeiro</h1>
              <div className="flex gap-2">
                {financials.length > 0 && (
                  <button 
                    onClick={handleClearFinancials} 
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold uppercase"
                  >
                    <Trash2 size={16} /> Limpar Tudo
                  </button>
                )}
                <button onClick={() => setIsFinancialModalOpen(true)} className="btn-primary">
                  <Plus size={20} /> Registro
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass p-4 rounded-2xl border-l-4 border-emerald-500">
                <p className="text-xs text-slate-500 uppercase font-bold">Entradas</p>
                <p className="text-xl font-black text-emerald-600">R$ {stats.totalIncome.toFixed(2)}</p>
              </div>
              <div className="glass p-4 rounded-2xl border-l-4 border-red-500">
                <p className="text-xs text-slate-500 uppercase font-bold">Saídas</p>
                <p className="text-xl font-black text-red-600">R$ {stats.totalExpense.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-2">
              {financials.map(fin => (
                <div key={fin.id} className="glass p-4 rounded-2xl flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-xl",
                      fin.type === 'income' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                    )}>
                      {fin.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    </div>
                    <div>
                      <p className="font-bold">{fin.description}</p>
                      <p className="text-xs text-slate-500">{format(parseISO(fin.date), "dd/MM/yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={cn("font-bold", fin.type === 'income' ? "text-emerald-600" : "text-red-600")}>
                      {fin.type === 'income' ? '+' : '-'} R$ {fin.amount.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-1">
                      <button 
                        type="button"
                        onClick={() => {
                          setNewFinancial(fin);
                          setIsFinancialModalOpen(true);
                        }}
                        className="p-2 text-slate-300 hover:text-primary transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Frontend: Delete financial button clicked for ID:', fin.id);
                          handleDeleteFinancial(fin.id);
                        }} 
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors relative z-10"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Configurações</h1>
            
            <div className="glass p-6 rounded-3xl space-y-6">
              <div className="space-y-4">
                <h3 className="font-bold">Informações da Empresa</h3>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <span className="text-xs font-bold uppercase text-slate-500 ml-1">Nome da Empresa</span>
                      <input 
                        type="text" 
                        className="input-field mt-1" 
                        placeholder="Ex: AF CLEAN"
                        value={settings.company_name || ''} 
                        onChange={e => handleUpdateCompanyName(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold uppercase text-slate-500 mb-1">Logo</span>
                      <button onClick={handleUpdateLogo} className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden hover:border-primary transition-colors">
                        {settings.logo ? (
                          <img src={settings.logo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={24} className="text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold">Tema do Sistema</h3>
                  <p className="text-sm text-slate-500">Alternar entre claro e escuro</p>
                </div>
                <button onClick={toggleTheme} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                  {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="font-bold mb-2">Sobre o {settings.company_name || 'AF CLEAN'} Manager</h3>
                <p className="text-xs text-slate-500">Versão 1.0.0 - Sistema de Gestão Profissional</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Appointment Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.form 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onSubmit={handleSaveAppointment}
              className="relative glass w-full max-w-md p-6 rounded-3xl space-y-4 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold">{editingAppointment?.id ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400"><X /></button>
              </div>

              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-bold uppercase text-slate-500 ml-1">Nome do Cliente</span>
                  <input 
                    required
                    type="text" 
                    className="input-field" 
                    value={editingAppointment?.customer_name || ''} 
                    onChange={e => setEditingAppointment({...editingAppointment, customer_name: e.target.value})}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase text-slate-500 ml-1">Endereço</span>
                  <input 
                    required
                    type="text" 
                    className="input-field" 
                    value={editingAppointment?.address || ''} 
                    onChange={e => setEditingAppointment({...editingAppointment, address: e.target.value})}
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-bold uppercase text-slate-500 ml-1">Telefone</span>
                    <input 
                      required
                      type="tel" 
                      className="input-field" 
                      placeholder="(00) 00000-0000"
                      value={editingAppointment?.phone || ''} 
                      onChange={e => setEditingAppointment({...editingAppointment, phone: e.target.value})}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase text-slate-500 ml-1">Data e Hora</span>
                    <input 
                      required
                      type="datetime-local" 
                      className="input-field" 
                      value={editingAppointment?.date || ''} 
                      onChange={e => setEditingAppointment({...editingAppointment, date: e.target.value})}
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-bold uppercase text-slate-500 ml-1">Valor (R$)</span>
                    <input 
                      type="number" 
                      step="0.01"
                      className="input-field" 
                      value={editingAppointment?.price || ''} 
                      onChange={e => setEditingAppointment({...editingAppointment, price: parseFloat(e.target.value)})}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase text-slate-500 ml-1">Tipo de Serviço</span>
                    <select 
                      className="input-field"
                      value={editingAppointment?.service_type || 'Limpeza de Sofá'}
                      onChange={e => setEditingAppointment({...editingAppointment, service_type: e.target.value})}
                    >
                      <option value="Limpeza de Sofá">Limpeza de Sofá</option>
                      <option value="Limpeza de Tapete">Limpeza de Tapete</option>
                      <option value="Limpeza de Colchão">Limpeza de Colchão</option>
                      <option value="Impermeabilização">Impermeabilização</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </label>
                </div>
              </div>

              <button type="submit" className="w-full btn-primary py-4 text-lg">
                <Save size={20} /> Salvar Agendamento
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Financial Modal */}
      <AnimatePresence>
        {isFinancialModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsFinancialModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.form 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onSubmit={handleSaveFinancial}
              className="relative glass w-full max-w-md p-6 rounded-3xl space-y-4"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold">{newFinancial.id ? 'Editar Registro' : 'Novo Registro Financeiro'}</h2>
                <button type="button" onClick={() => setIsFinancialModalOpen(false)} className="p-2 text-slate-400"><X /></button>
              </div>

              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
                <button 
                  type="button"
                  onClick={() => setNewFinancial({...newFinancial, type: 'income'})}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                    newFinancial.type === 'income' ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm" : "text-slate-500"
                  )}
                >
                  Entrada
                </button>
                <button 
                  type="button"
                  onClick={() => setNewFinancial({...newFinancial, type: 'expense'})}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                    newFinancial.type === 'expense' ? "bg-white dark:bg-slate-700 text-red-600 shadow-sm" : "text-slate-500"
                  )}
                >
                  Saída
                </button>
              </div>

              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-bold uppercase text-slate-500 ml-1">Descrição</span>
                  <input 
                    required
                    type="text" 
                    className="input-field" 
                    value={newFinancial.description || ''} 
                    onChange={e => setNewFinancial({...newFinancial, description: e.target.value})}
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-bold uppercase text-slate-500 ml-1">Valor (R$)</span>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      className="input-field" 
                      value={newFinancial.amount || ''} 
                      onChange={e => setNewFinancial({...newFinancial, amount: parseFloat(e.target.value)})}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase text-slate-500 ml-1">Data</span>
                    <input 
                      required
                      type="date" 
                      className="input-field" 
                      value={newFinancial.date || ''} 
                      onChange={e => setNewFinancial({...newFinancial, date: e.target.value})}
                    />
                  </label>
                </div>
              </div>

              <button type="submit" className="w-full btn-primary py-4 text-lg">
                <Save size={20} /> Salvar Registro
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Service Execution Overlay */}
      <AnimatePresence>
        {activeService && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-0 z-[70] bg-slate-50 dark:bg-slate-950 overflow-y-auto"
          >
            <div className="p-4 max-w-2xl mx-auto space-y-6 pb-24">
              <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => setActiveService(null)} className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                    <X size={24} />
                  </button>
                  <div>
                    <h1 className="text-xl font-bold">Executando Serviço</h1>
                    <p className="text-sm text-slate-500">{activeService.customer_name}</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAppointment(activeService.id);
                    setActiveService(null);
                  }}
                  className="p-3 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 transition-colors"
                  title="Excluir este serviço"
                >
                  <Trash2 size={20} />
                </button>
              </header>

              <div className="space-y-8">
                {/* Step 1: Before Photos */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">1</div>
                      Checklist: Fotos Iniciais
                    </div>
                    <button 
                      onClick={() => handlePhotoCapture('before')}
                      className="text-xs font-bold text-primary uppercase flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full"
                    >
                      <Plus size={14} /> Adicionar
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {activeService.before_photos.map((photo, idx) => (
                      <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden group">
                        <img src={photo} alt={`Antes ${idx}`} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => handleRemovePhoto('before', idx)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {activeService.before_photos.length === 0 && (
                      <div 
                        onClick={() => handlePhotoCapture('before')}
                        className="col-span-2 aspect-video glass rounded-3xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                      >
                        <Camera size={32} className="text-slate-300 mb-2" />
                        <p className="text-xs text-slate-400">Tirar fotos do sofá (Antes)</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Step 2: After Photos */}
                <section className={cn("space-y-4 transition-opacity", activeService.before_photos.length === 0 && "opacity-30 pointer-events-none")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">2</div>
                      Resultado: Fotos Finais
                    </div>
                    <button 
                      onClick={() => handlePhotoCapture('after')}
                      className="text-xs font-bold text-primary uppercase flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full"
                    >
                      <Plus size={14} /> Adicionar
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {activeService.after_photos.map((photo, idx) => (
                      <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden group">
                        <img src={photo} alt={`Depois ${idx}`} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => handleRemovePhoto('after', idx)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {activeService.after_photos.length === 0 && (
                      <div 
                        onClick={() => handlePhotoCapture('after')}
                        className="col-span-2 aspect-video glass rounded-3xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                      >
                        <Camera size={32} className="text-slate-300 mb-2" />
                        <p className="text-xs text-slate-400">Tirar fotos do resultado (Depois)</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Step 3: Pagamento */}
                <section className={cn("space-y-4 transition-opacity", activeService.after_photos.length === 0 && "opacity-30 pointer-events-none")}>
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">3</div>
                    Pagamento e Valor
                  </div>
                  <div className="glass rounded-3xl p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-xs font-bold uppercase text-slate-500 ml-1">Valor Final (R$)</span>
                        <input 
                          type="number" 
                          step="0.01"
                          className="input-field" 
                          value={activeService.price || ''} 
                          onChange={e => setActiveService({...activeService, price: parseFloat(e.target.value)})}
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-bold uppercase text-slate-500 ml-1">Forma de Pagamento</span>
                        <select 
                          className="input-field"
                          value={activeService.payment_method || 'Dinheiro'}
                          onChange={e => setActiveService({...activeService, payment_method: e.target.value})}
                        >
                          <option>Dinheiro</option>
                          <option>Pix</option>
                          <option>Cartão de Crédito</option>
                          <option>Cartão de Débito</option>
                        </select>
                      </label>
                    </div>
                    {activeService.payment_method === 'Cartão de Crédito' && (
                      <label className="block">
                        <span className="text-xs font-bold uppercase text-slate-500 ml-1">Número de Parcelas</span>
                        <input 
                          type="number" 
                          min="1"
                          max="12"
                          className="input-field" 
                          value={activeService.installments || 1} 
                          onChange={e => setActiveService({...activeService, installments: parseInt(e.target.value)})}
                        />
                      </label>
                    )}
                  </div>
                </section>

                {/* Step 4: Signature */}
                <section className={cn("space-y-4 transition-opacity", activeService.after_photos.length === 0 && "opacity-30 pointer-events-none")}>
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">4</div>
                    Assinatura do Cliente
                  </div>
                  <div className="glass rounded-3xl p-4 space-y-2">
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <SignatureCanvas 
                        ref={sigCanvas}
                        penColor='black'
                        canvasProps={{ 
                          className: 'w-full h-48 cursor-crosshair',
                          style: { width: '100%', height: '192px' }
                        }}
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => sigCanvas.current?.clear()}
                      className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Limpar Assinatura
                    </button>
                  </div>
                </section>

                {/* Step 5: Reminder Info */}
                <section className={cn("space-y-4 transition-opacity", activeService.after_photos.length === 0 && "opacity-30 pointer-events-none")}>
                  <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 text-primary text-sm flex gap-3">
                    <Clock size={20} className="shrink-0" />
                    <p>O sistema lembrará automaticamente este cliente em <b>{format(addMonths(new Date(), 6), "MMMM 'de' yyyy", { locale: ptBR })}</b> para uma nova limpeza.</p>
                  </div>
                </section>

                <button 
                  type="button"
                  onClick={handleFinalizeService}
                  disabled={activeService.after_photos.length === 0}
                  className="w-full btn-primary py-4 text-xl shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  <CheckCircle2 size={24} /> Finalizar e Receber
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
