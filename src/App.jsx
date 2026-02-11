import React, { useState } from 'react';
import {
  BarChart3,
  Settings,
  Layers,
  Calendar as CalIcon,
  Sparkles,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Home
} from 'lucide-react';
import ProjectOverview from './components/ProjectOverview';
import ContentGeneratorPanel from './components/ContentGeneratorPanel';
import ContentCalendar from './components/ContentCalendar';
import AIChatAssistant from './components/AIChatAssistant';
import AdsAnalytics from './components/AdsAnalytics';
import UnifiedDashboard from './components/UnifiedDashboard';

function App() {
  // Initialize from URL or default to 'home'
  const [activeTab, setActiveTabState] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'home';
  });

  const [isSidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile

  // Sync state changes to URL
  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    const url = new URL(window.location);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url);
  };

  // Handle browser back/forward buttons
  React.useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveTabState(params.get('tab') || 'home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <UnifiedDashboard setActiveTab={setActiveTab} />;
      case 'dashboard':
        return <ProjectOverview onSelectCampaign={() => setActiveTab('generator')} />;
      case 'generator':
        return <ContentGeneratorPanel />;
      case 'calendar':
        return <ContentCalendar />;
      case 'chat':
        return <AIChatAssistant />;
      case 'analytics':
        return <AdsAnalytics />;
      default:
        return <UnifiedDashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen bg-black text-zinc-300 font-sans overflow-hidden">

      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-800 rounded-lg text-white shadow-lg"
        onClick={() => setSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed lg:relative lg:translate-x-0 z-40 w-64 h-full bg-surface border-r border-zinc-900 flex flex-col transition-transform duration-300 shadow-2xl`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-zinc-900">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-700 flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">
            M
          </div>
          <span className="font-bold text-lg tracking-wide text-white">Marketing OS</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem
            icon={<Home size={20} />}
            label="Inicio"
            isActive={activeTab === 'home'}
            onClick={() => { setActiveTab('home'); setSidebarOpen(false); }}
          />
          <div className="px-4 py-2 mt-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider">Gestión</div>
          <NavItem
            icon={<Layers size={20} />}
            label="Campañas"
            isActive={activeTab === 'dashboard'}
            onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
          />
          <NavItem
            icon={<CalIcon size={20} />}
            label="Calendario"
            isActive={activeTab === 'calendar'}
            onClick={() => { setActiveTab('calendar'); setSidebarOpen(false); }}
          />

          <div className="px-4 py-2 mt-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider">Inteligencia</div>
          <NavItem
            icon={<MessageSquare size={20} />}
            label="Chat IA"
            isActive={activeTab === 'chat'}
            onClick={() => { setActiveTab('chat'); setSidebarOpen(false); }}
          />
          <NavItem
            icon={<Sparkles size={20} />}
            label="Generador"
            isActive={activeTab === 'generator'}
            onClick={() => { setActiveTab('generator'); setSidebarOpen(false); }}
          />

          <div className="px-4 py-2 mt-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider">Métricas</div>
          <NavItem
            icon={<BarChart3 size={20} />}
            label="Analíticas Ads"
            isActive={activeTab === 'analytics'}
            onClick={() => { setActiveTab('analytics'); setSidebarOpen(false); }}
          />

          <div className="my-4 border-t border-zinc-900" />
          <NavItem icon={<Settings size={20} />} label="Configuración" />
        </nav>

        <div className="p-4 border-t border-zinc-900">
          <button className="flex items-center gap-3 w-full p-3 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-colors">
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden flex flex-col relative w-full lg:w-[calc(100%-256px)] bg-black">
        {/* Header */}
        <header className="h-16 border-b border-zinc-900 bg-black/50 backdrop-blur-sm flex items-center justify-between px-6 lg:px-8 shrink-0 z-30">
          <div className="flex items-center gap-2 text-zinc-600 text-sm ml-8 lg:ml-0">
            <span className="hover:text-zinc-400 cursor-pointer">Marketing OS</span>
            <span>/</span>
            <span className="text-white capitalize font-medium">{activeTab === 'home' ? 'Inicio' : activeTab}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-zinc-600 ring-2 ring-black"></div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {renderContent()}
        </div>
      </main>

    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full p-3 rounded-lg font-medium transition-all group ${isActive
        ? 'bg-primary/10 text-primary border border-primary/20'
        : 'text-zinc-500 hover:bg-zinc-900 hover:text-white border border-transparent'
        }`}
    >
      <span className={`${isActive ? 'text-primary' : 'text-zinc-500 group-hover:text-white'} transition-colors`}>
        {icon}
      </span>
      {label}
    </button>
  );
}

export default App;
