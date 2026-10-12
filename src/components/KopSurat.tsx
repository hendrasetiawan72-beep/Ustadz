import React, { useState } from 'react';
import { AppSettings } from '../types';

interface KopSuratProps {
  settings: AppSettings;
  reportTitle?: string;
  reportPeriod?: string;
  className?: string;
}

export const KopSurat: React.FC<KopSuratProps> = ({
  settings,
  reportTitle,
  reportPeriod,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className={`w-full bg-white text-slate-900 pb-2 ${className}`}>
      <div className="flex items-center gap-5 border-b-2 border-slate-800 pb-3">
        {/* Logo Resmi */}
        <div className="shrink-0 flex items-center justify-center">
          {!imageError && settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt="Logo Resmi Ponpes Baitul Arqom SMK Muhiba"
              referrerPolicy="no-referrer"
              className="h-20 w-20 object-contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="h-20 w-20 rounded-xl bg-emerald-700 text-white flex flex-col items-center justify-center font-bold text-xs p-1 text-center shadow-inner">
              <span>MUHIBA</span>
              <span className="text-[9px] font-normal opacity-90">BAITUL ARQOM</span>
            </div>
          )}
        </div>

        {/* Identitas Lembaga */}
        <div className="flex-1 text-center pr-4">
          <h1 className="text-xl font-extrabold tracking-wider text-slate-900 uppercase">
            {settings.institutionName}
          </h1>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">
            {settings.subTitle}
          </p>
          <p className="text-[11px] text-slate-600 mt-1">
            {settings.address} &middot; Telp/WA: {settings.phone}
          </p>
          <p className="text-[10px] text-slate-500">
            Email: {settings.email} &middot; Web: {settings.website}
          </p>
        </div>
      </div>

      {/* Garis Ganda Standar Surat Resmi */}
      <div className="border-b border-slate-800 pt-[2px] mb-4"></div>

      {/* Judul Laporan & Periode jika diberikan */}
      {reportTitle && (
        <div className="text-center my-3">
          <h2 className="text-base font-bold uppercase tracking-wide text-slate-900">
            {reportTitle}
          </h2>
          {reportPeriod && (
            <p className="text-xs font-medium text-slate-600 mt-0.5">
              Periode: {reportPeriod}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
