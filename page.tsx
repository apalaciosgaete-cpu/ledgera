'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type OnboardingStep = 'WELCOME' | 'CONNECT' | 'PROCESSING' | 'WOW_MOMENT';

export default function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>('WELCOME');
  const [progress, setProgress] = useState(1);
  const router = useRouter();

  // Step 1: Welcome
  if (step === 'WELCOME') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Bienvenido a LEDGERA</h1>
        <p className="text-lg text-slate-600 mb-8 max-w-md">
          Antes de comenzar, conectemos tus datos para entregarte una visión clara de tu portafolio.
        </p>
        <button
          onClick={() => { setStep('CONNECT'); setProgress(2); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition-all"
        >
          Conectar datos
        </button>
      </div>
    );
  }

  // Step 2: Connection Selection
  if (step === 'CONNECT') {
    const providers = [
      { id: 'binance', name: 'Binance', icon: '🔶' },
      { id: 'crypto', name: 'Crypto.com', icon: '🔵' },
      { id: 'coinbase', name: 'Coinbase', icon: '🛡️' },
      { id: 'kraken', name: 'Kraken', icon: '🐙' },
      { id: 'csv', name: 'Archivo CSV', icon: '📄' },
    ];

    return (
      <div className="max-w-2xl mx-auto py-12 px-6">
        <div className="mb-8">
          <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Paso {progress}/4</span>
          <h2 className="text-3xl font-bold text-slate-900">¿De dónde vienen tus datos?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => { setStep('PROCESSING'); setProgress(3); }}
              className="flex items-center p-4 border-2 border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
            >
              <span className="text-2xl mr-4">{p.icon}</span>
              <span className="font-medium text-slate-800">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step 3: Processing Simulation
  if (step === 'PROCESSING') {
    return <ProcessingScreen onComplete={() => { setStep('WOW_MOMENT'); setProgress(4); }} />;
  }

  // Step 4: WOW Moment
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 text-center">
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Tu situación frente al SII</h2>
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 font-semibold">
          🟡 Declaración recomendada
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 mb-1">Impuesto estimado</p>
          <h3 className="text-4xl font-bold text-slate-900">$180.000</h3>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 mb-4">Activos detectados</p>
          <div className="flex justify-center gap-4 text-xl font-bold text-slate-700">
            <span>BTC</span>
            <span>ETH</span>
            <span>ADA</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => router.push('/dashboard')}
        className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-12 rounded-xl transition-all"
      >
        Ir a mi panel completo
      </button>
    </div>
  );
}

function ProcessingScreen({ onComplete }: { onComplete: () => void }) {
  const [tasks, setTasks] = useState([
    { label: 'Analizando movimientos...', done: false },
    { label: 'Calculando compras y ventas', done: false },
    { label: 'Identificando staking', done: false },
    { label: 'Preparando resumen tributario', done: false },
  ]);

  useEffect(() => {
    tasks.forEach((_, i) => {
      setTimeout(() => {
        setTasks(prev => prev.map((t, idx) => idx === i ? { ...t, done: true } : t));
        if (i === tasks.length - 1) setTimeout(onComplete, 1000);
      }, (i + 1) * 1200);
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6">
      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-8"></div>
      <div className="space-y-4 w-full max-w-xs">
        {tasks.map((t, i) => (
          <div key={i} className={`flex items-center transition-opacity ${t.done ? 'opacity-100' : 'opacity-40'}`}>
            <span className="mr-3">{t.done ? '✅' : '⏳'}</span>
            <span className="font-medium text-slate-700">{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}