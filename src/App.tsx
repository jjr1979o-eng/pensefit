/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Receipt, 
  Pizza, 
  Leaf, 
  Calendar, 
  BarChart3, 
  Menu, 
  X,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './lib/firebase';

// Screens (to be implemented)
import Dashboard from './components/Dashboard';
import NovaCompra from './components/NovaCompra';
import Comprovantes from './components/Comprovantes';
import Ingredientes from './components/Ingredientes';
import Marmitas from './components/Marmitas';
import ResumoSemanal from './components/ResumoSemanal';
import Relatorios from './components/Relatorios';

type ActiveScreen = 'dashboard' | 'compras' | 'comprovantes' | 'ingredientes' | 'marmitas' | 'resumo' | 'relatorios';

function LoginScreen() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[48px] p-10 md:p-14 shadow-2xl space-y-10 text-center">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center text-white text-4xl font-black mx-auto shadow-xl shadow-emerald-500/20">P</div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter">Pensefit <span className="text-emerald-500">Custos</span></h1>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest leading-relaxed">Gestão profissional para marmitarias modernas</p>
        </div>

        <button 
          onClick={signInWithGoogle}
          className="w-full bg-slate-900 text-white rounded-3xl p-6 font-black text-xl flex items-center justify-center gap-4 hover:bg-slate-800 active:scale-[0.98] transition-all shadow-xl"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
          Entrar com Google
        </button>

        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Seus dados sempre seguros e sincronizados</p>
        <div className="pt-4 border-t border-slate-50">
          <p className="text-[9px] text-slate-300 font-medium">Nota: Se estiver no Netlify, adicione o domínio no Firebase Console.</p>
        </div>
      </div>
    </div>
  );
}

function MainApp() {
  const { user, loading, logout } = useAuth();
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'compras', name: 'Nova Compra', icon: ShoppingBag },
// ... rest of navigation array ...
    { id: 'comprovantes', name: 'Comprovantes', icon: Receipt },
    { id: 'ingredientes', name: 'Ingredientes', icon: Leaf },
    { id: 'marmitas', name: 'Marmitas', icon: Pizza },
    { id: 'resumo', name: 'Resumo Semanal', icon: Calendar },
    { id: 'relatorios', name: 'Relatórios', icon: BarChart3 },
  ];

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard': return <Dashboard onNavigate={(screen) => setActiveScreen(screen as ActiveScreen)} />;
      case 'compras': return <NovaCompra onBack={() => setActiveScreen('dashboard')} />;
      case 'comprovantes': return <Comprovantes onBack={() => setActiveScreen('dashboard')} />;
      case 'ingredientes': return <Ingredientes onBack={() => setActiveScreen('dashboard')} />;
      case 'marmitas': return <Marmitas onBack={() => setActiveScreen('dashboard')} />;
      case 'resumo': return <ResumoSemanal onBack={() => setActiveScreen('dashboard')} />;
      case 'relatorios': return <Relatorios onBack={() => setActiveScreen('dashboard')} />;
      default: return <Dashboard onNavigate={(screen) => setActiveScreen(screen as ActiveScreen)}  />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2" onClick={() => setActiveScreen('dashboard')} style={{ cursor: 'pointer' }}>
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-xl leading-none">P</div>
            <h1 className="text-xl font-bold tracking-tight text-emerald-900">
              Pensefit <span className="text-slate-500 font-normal underline decoration-emerald-200">Custos</span>
            </h1>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id as ActiveScreen)}
                className={`text-sm font-semibold transition-colors ${
                  activeScreen === item.id ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-600'
                }`}
              >
                {item.name}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-100">Live Sync</span>
            
            <div className="group relative">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                alt={user.displayName || 'User'} 
                className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm shrink-0 cursor-pointer"
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                <div className="px-4 py-2 border-b border-slate-50">
                  <p className="text-xs font-black text-slate-800 truncate">{user.displayName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                </div>
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-3 text-red-500 hover:bg-red-50 transition-colors text-xs font-bold"
                >
                  <LogOut size={14} /> Sair do App
                </button>
              </div>
            </div>
            
            {/* Mobile Menu Button - Optional since we have bottom nav, but good for "More" */}
            <button 
              className="md:hidden p-2 text-slate-500"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] md:hidden"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-3/4 max-w-sm bg-white z-[70] shadow-2xl p-6 md:hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-bold text-lg text-slate-800">Opções</h2>
                <button onClick={() => setIsMenuOpen(false)} className="p-1 text-slate-400"><X size={24} /></button>
              </div>
              <nav className="flex flex-col gap-2">
                {navigation.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveScreen(item.id as ActiveScreen);
                      setIsMenuOpen(false);
                    }}
                    className={`flex items-center justify-between p-4 rounded-2xl text-left border transition-all ${
                      activeScreen === item.id 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                        : 'border-slate-50 text-slate-600 active:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} className={activeScreen === item.id ? 'text-emerald-600' : 'text-slate-400'} />
                      <span className="font-bold">{item.name}</span>
                    </div>
                    <ChevronRight size={16} className={activeScreen === item.id ? 'text-emerald-300' : 'text-slate-200'} />
                  </button>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeScreen}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation Bar (Fixed Bottom for Mobile) */}
      <nav className="md:hidden bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center sticky bottom-0 z-50">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Início' },
          { id: 'compras', icon: ShoppingBag, label: 'Compras' },
          { id: 'ingredientes', icon: Leaf, label: 'Itens' },
          { id: 'marmitas', icon: Pizza, label: 'Marmitas' },
          { id: 'relatorios', icon: BarChart3, label: 'Relatórios' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveScreen(item.id as ActiveScreen)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeScreen === item.id ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            <item.icon size={24} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Desktop Navigation Helper / Footer */}
      <footer className="hidden md:block py-8 text-center text-slate-400 text-xs border-t border-slate-100">
        &copy; 2026 Pensefit Custos • Gestão Minimalista de Marmitaria
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

