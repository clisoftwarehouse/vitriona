'use client';

import { useEffect } from 'react';
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

const TOUR_KEY = 'vitriona-dashboard-tour-completed';

export function DashboardTour() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(TOUR_KEY)) return;

    const timeout = setTimeout(() => {
      const hasBusinessSelector = document.getElementById('sidebar-business-selector');
      const hasSidebarNav = document.getElementById('sidebar-nav');
      if (!hasSidebarNav) return;

      const steps: DriveStep[] = [
        {
          popover: {
            title: '¡Bienvenido a Vitriona!',
            description:
              'Tu negocio ha sido creado exitosamente. Te daremos un tour rápido por el dashboard para que sepas dónde encontrar todo.',
            side: 'bottom' as const,
            align: 'center' as const,
          },
        },
      ];

      if (hasBusinessSelector) {
        steps.push({
          element: '#sidebar-business-selector',
          popover: {
            title: 'Selector de negocio',
            description:
              'Si tienes varios negocios, puedes cambiar entre ellos aquí. Todo el dashboard se adapta al negocio seleccionado.',
            side: 'right' as const,
            align: 'start' as const,
          },
        });
      }

      steps.push(
        {
          element: '#sidebar-nav',
          popover: {
            title: 'Navegación principal',
            description:
              'Desde aquí accedes a todas las secciones: catálogos, productos, pedidos, inventario, reseñas, cupones, métodos de pago y más.',
            side: 'right' as const,
            align: 'start' as const,
          },
        },
        {
          element: '#sidebar-builder-btn',
          popover: {
            title: 'Site Builder',
            description:
              'Personaliza la apariencia de tu tienda: colores, fuentes, hero, secciones y SEO. Tu storefront se actualiza al instante.',
            side: 'right' as const,
            align: 'center' as const,
          },
        },
        {
          element: '#sidebar-store-btn',
          popover: {
            title: 'Ver tu tienda',
            description:
              'Abre tu tienda digital en una nueva pestaña. Comparte este enlace con tus clientes para que vean tu catálogo.',
            side: 'right' as const,
            align: 'center' as const,
          },
        },
        {
          popover: {
            title: '¡Todo listo!',
            description:
              'Te recomendamos empezar agregando productos y luego personalizar tu tienda con el Site Builder. ¡Mucho éxito!',
            side: 'bottom' as const,
            align: 'center' as const,
          },
        }
      );

      const tour = driver({
        showProgress: true,
        animate: true,
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        stagePadding: 8,
        stageRadius: 12,
        nextBtnText: 'Siguiente',
        prevBtnText: 'Anterior',
        doneBtnText: '¡Empezar!',
        progressText: '{{current}} de {{total}}',
        onDestroyed: () => {
          localStorage.setItem(TOUR_KEY, 'true');
        },
        steps,
      });

      tour.drive();
    }, 800);

    return () => clearTimeout(timeout);
  }, []);

  return null;
}
