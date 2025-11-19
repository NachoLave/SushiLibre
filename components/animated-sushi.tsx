'use client';

import { useState, useEffect, useRef } from 'react';

interface AnimatedSushiProps {
  isEating?: boolean;
}

const SPLINE_URL = 'https://prod.spline.design/daVqMY1406-HZR3T/scene.splinecode';

export default function AnimatedSushi({ isEating = false }: AnimatedSushiProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cargar el script de Spline viewer dinámicamente
    if (typeof window !== 'undefined' && !scriptLoaded) {
      // Verificar si el script ya está cargado
      const existingScript = document.querySelector('script[src*="spline-viewer"]');
      if (existingScript) {
        setScriptLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@splinetool/viewer@1.11.8/build/spline-viewer.js';
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => {
        console.warn('Error loading Spline viewer script');
      };
      document.head.appendChild(script);
    }
  }, [scriptLoaded]);

  useEffect(() => {
    // Manejar errores del viewer de Spline
    if (scriptLoaded && containerRef.current) {
      // Capturar errores de la consola relacionados con Spline ANTES de que se renderice
      const originalError = console.error;
      const originalWarn = console.warn;
      
      const handleConsoleError = (...args: any[]) => {
        const errorMessage = args.join(' ').toLowerCase();
        if (errorMessage.includes('camera') || errorMessage.includes('target camera') || errorMessage.includes('spline')) {
          setHasError(true);
          return; // No mostrar el error en consola
        }
        originalError.apply(console, args);
      };
      
      const handleConsoleWarn = (...args: any[]) => {
        const warnMessage = args.join(' ').toLowerCase();
        if (warnMessage.includes('camera') || warnMessage.includes('target camera')) {
          setHasError(true);
          return; // No mostrar el warning en consola
        }
        originalWarn.apply(console, args);
      };
      
      console.error = handleConsoleError;
      console.warn = handleConsoleWarn;

      // Detectar errores inmediatamente cuando el viewer se carga
      const checkForErrors = () => {
        const viewer = containerRef.current?.querySelector('spline-viewer');
        if (viewer) {
          // Esperar un momento para que el viewer intente cargar
          setTimeout(() => {
            const canvas = viewer.shadowRoot?.querySelector('canvas');
            // Si no hay canvas o está vacío, usar fallback
            if (!canvas || (canvas.width === 0 && canvas.height === 0)) {
              setHasError(true);
            }
          }, 1000);
        }
      };

      // Verificar errores después de un breve delay
      const errorTimeout = setTimeout(() => {
        checkForErrors();
      }, 500);

      const viewer = containerRef.current?.querySelector('spline-viewer');
      
      if (viewer) {
        // Ocultar el badge de "Built with Spline"
        const hideBadge = () => {
          const shadowRoot = viewer.shadowRoot;
          if (shadowRoot) {
            const badges = shadowRoot.querySelectorAll('a, [class*="badge"], [class*="branding"], [class*="logo"]');
            badges.forEach((badge) => {
              (badge as HTMLElement).style.display = 'none';
            });
          }
          
          const allLinks = viewer.querySelectorAll('a');
          allLinks.forEach((link) => {
            if (link.href?.includes('spline') || link.textContent?.toLowerCase().includes('built')) {
              (link as HTMLElement).style.display = 'none';
            }
          });
        };

        // Intentar ocultar inmediatamente y después de un delay
        hideBadge();
        const interval = setInterval(() => {
          hideBadge();
        }, 500);

        return () => {
          clearInterval(interval);
          clearTimeout(errorTimeout);
          console.error = originalError;
          console.warn = originalWarn;
        };
      } else {
        clearTimeout(errorTimeout);
        console.error = originalError;
        console.warn = originalWarn;
      }
    }
  }, [scriptLoaded]);

  useEffect(() => {
    // Animar cuando come - el componente Spline se animará con la clase CSS
    // La animación bounce-scale se aplica al contenedor
  }, [isEating]);

  return (
    <div 
      ref={containerRef}
      className={`relative transition-all duration-300 ${isEating ? 'scale-110 animate-bounce-scale' : 'scale-100'}`}
      style={{ width: '380px', height: '380px' }}
    >
      {scriptLoaded && !hasError ? (
        <>
          <spline-viewer
            url={SPLINE_URL}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
          {/* Overlay para ocultar el badge de "Built with Spline" */}
          {/* Cubre la esquina inferior derecha donde típicamente aparece el badge */}
          {/* Usa los mismos colores del fondo: pink-50, blue-50, green-50 */}
          <div 
            className="absolute bottom-2 right-2 w-44 h-18 pointer-events-none z-20 rounded-lg"
            style={{
              background: 'linear-gradient(to bottom right, rgb(253 244 255) 0%, rgb(239 246 255) 50%, rgb(240 253 244) 100%)',
              backdropFilter: 'blur(4px)',
            }}
          />
        </>
      ) : hasError ? (
        // Fallback SVG si hay error con Spline
        <div className="w-full h-full flex items-center justify-center">
          <svg
            width="280"
            height="280"
            viewBox="0 0 140 140"
            className="drop-shadow-lg"
          >
            <defs>
              <linearGradient id="noriGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2d1b0e" />
                <stop offset="50%" stopColor="#1a1a1a" />
                <stop offset="100%" stopColor="#0f0f0f" />
              </linearGradient>
              <linearGradient id="riceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fffef5" />
                <stop offset="50%" stopColor="#f5f5dc" />
                <stop offset="100%" stopColor="#e8e8d0" />
              </linearGradient>
              <linearGradient id="salmonGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffb3ba" />
                <stop offset="50%" stopColor="#ff8c94" />
                <stop offset="100%" stopColor="#ff6b7a" />
              </linearGradient>
            </defs>
            
            <path
              d="M 35 45 Q 70 25 105 45 L 105 95 Q 70 115 35 95 Z"
              fill="url(#noriGradient)"
              className="drop-shadow-md"
            />
            
            <ellipse cx="70" cy="70" rx="30" ry="25" fill="url(#riceGradient)" opacity="0.95" />
            
            <ellipse cx="70" cy="65" rx="22" ry="15" fill="url(#salmonGradient)" />
            
            <circle cx="55" cy="80" r="6" fill="#ffffff" />
            <circle cx="55" cy="80" r="4" fill="#4a90e2" />
            <circle cx="56" cy="79" r="2" fill="#000000" />
            
            <circle cx="85" cy="80" r="6" fill="#ffffff" />
            <circle cx="85" cy="80" r="4" fill="#4a90e2" />
            <circle cx="86" cy="79" r="2" fill="#000000" />
            
            <path
              d="M 58 90 Q 70 96 82 90"
              stroke="#000000"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            
            <ellipse cx="45" cy="85" rx="5" ry="4" fill="#ffb3ba" opacity="0.6" />
            <ellipse cx="95" cy="85" rx="5" ry="4" fill="#ffb3ba" opacity="0.6" />
          </svg>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
