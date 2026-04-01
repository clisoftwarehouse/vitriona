'use client';

import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const TOUR_KEY = 'vitriona-builder-tour-completed';

export function BuilderTour() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(TOUR_KEY)) return;

    const timeout = setTimeout(() => {
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
        steps: [
          {
            popover: {
              title: '¡Bienvenido al Site Builder!',
              description:
                'Aquí puedes personalizar completamente la apariencia de tu tienda digital. Te guiaremos rápidamente por las herramientas principales.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#builder-section-tabs',
            popover: {
              title: 'Secciones del builder',
              description:
                'Navega entre las secciones: Tema (colores y fuentes), Hero (banner principal), Secciones (categorías y productos), Anuncio (barra superior) y SEO.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#builder-settings-panel',
            popover: {
              title: 'Panel de ajustes',
              description:
                'Aquí configuras cada sección. Empieza eligiendo un tema prediseñado o personaliza los colores a tu gusto.',
              side: 'right',
              align: 'start',
            },
          },
          {
            element: '#builder-preview-area',
            popover: {
              title: 'Vista previa en tiempo real',
              description:
                'Todos los cambios que hagas se reflejan aquí al instante. Puedes alternar entre vista de escritorio y móvil.',
              side: 'left',
              align: 'center',
            },
          },
          {
            element: '#builder-preview-btn',
            popover: {
              title: 'Ver tu tienda',
              description: 'Abre tu storefront público en una nueva pestaña para ver cómo se ve en vivo.',
              side: 'bottom',
              align: 'end',
            },
          },
          {
            element: '#builder-publish-btn',
            popover: {
              title: 'Publicar cambios',
              description:
                'Cuando estés satisfecho con tus cambios, presiona este botón para publicarlos. ¡Tu tienda se actualizará al instante!',
              side: 'bottom',
              align: 'end',
            },
          },
        ],
      });

      tour.drive();
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  return null;
}
