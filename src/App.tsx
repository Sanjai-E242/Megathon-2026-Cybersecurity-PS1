import React, { useState, useEffect } from 'react';
import { Navbar } from './components/landing/Navbar';
import { HeroSection } from './components/landing/HeroSection';
import { ProblemSection } from './components/landing/ProblemSection';
import { SolutionPipeline } from './components/landing/SolutionPipeline';
import { ThreeLayersSection } from './components/landing/ThreeLayersSection';
import { ContrastSection } from './components/landing/ContrastSection';
import { CTASection } from './components/landing/CTASection';
import { ThemeProvider } from './lib/theme';
import { SecurityConsole } from './components/dashboard/SecurityConsole';

export const AppContent: React.FC = () => {
  const [view, setView] = useState<'landing' | 'console'>('landing');
  const [initialScenario, setInitialScenario] = useState<'attack-escalation' | 'legitimate-migration' | null>(null);

  // Sync with browser URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('console') || hash.includes('scenarios') || hash.includes('audit')) {
        setView('console');
      } else {
        setView('landing');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const openConsole = (scenario?: 'attack-escalation' | 'legitimate-migration') => {
    setInitialScenario(scenario || null);
    setView('console');
    window.location.hash = 'console';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const backToLanding = () => {
    setView('landing');
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#06080d] dark:text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-600 dark:selection:text-cyan-200 transition-colors duration-200">

      {view === 'console' ? (
        <SecurityConsole
          onBackToLanding={backToLanding}
          initialScenario={initialScenario}
        />
      ) : (
        <div className="flex flex-col min-h-screen">
          <Navbar
            onOpenConsole={() => openConsole()}
            onRunAttackDemo={() => openConsole('attack-escalation')}
          />
          
          <main className="flex-1">
            <HeroSection
              onOpenConsole={() => openConsole()}
              onRunAttackDemo={() => openConsole('attack-escalation')}
            />
            <ProblemSection />
            <SolutionPipeline />
            <ThreeLayersSection />
            <ContrastSection
              onRunAttack={() => openConsole('attack-escalation')}
              onRunLegit={() => openConsole('legitimate-migration')}
            />
            <CTASection
              onOpenConsole={() => openConsole()}
              onRunAttackDemo={() => openConsole('attack-escalation')}
            />
          </main>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;

