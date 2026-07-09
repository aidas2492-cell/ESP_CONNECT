import React, { useEffect, useState } from 'react';
import api from '../api/axiosInstance';

export default function GalerieWidget() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    api.get('/feed/meta/galerie').then(({ data }) => setImages(data.images || [])).catch(() => {});
  }, []);

  if (images.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📸 La vie du campus en images</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 px-2">
        {images.map((img) => (
          <div key={img.id} className="aspect-square overflow-hidden rounded-2xl group relative">
            <img src={img.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
          </div>
        ))}
      </div>
    </section>
  );
}
