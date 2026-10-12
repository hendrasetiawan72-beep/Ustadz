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

  const hasContactInfo = Boolean(
    settings.address || settings.phone || settings.email || settings.website
  );

  return (
    <div className={`w-full bg-white text-slate-900 pb-2 ${className}`}>
      {/* Kop Header: Logo di Kiri & Teks di Tengah */}
      <div className="flex items-center gap-3 sm:gap-6 pb-3">
        {/* Logo Resmi Lembaga */}
        <div className="shrink-0 flex items-center justify-center">
          {!imageError && settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt="Logo Resmi Ponpes Baitul Arqom SMK Muhiba"
              referrerPolicy="no-referrer"
              className="h-18 w-18 sm:h-22 sm:w-22 object-contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="h-18 w-18 sm:h-22 sm:w-22 rounded-xl bg-emerald-800 text-white flex flex-col items-center justify-center font-bold text-xs p-1 text-center shadow-inner">
              <span className="font-extrabold text-[13px] leading-tight">MUHIBA</span>
              <span className="text-[9px] font-semibold tracking-wider opacity-90">BAITUL ARQOM</span>
            </div>
          )}
        </div>

        {/* Identitas Resmi Lembaga */}
        <div className="flex-1 text-center min-w-0 pr-1 sm:pr-4">
          <h1 className="text-base sm:text-xl font-black tracking-wide text-slate-950 uppercase leading-snug break-words">
            PONPES BAITUL ARQOM SMK MUHIBA
          </h1>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-800 uppercase tracking-wider mt-0.5 break-words">
            SMK MUHAMMADIYAH BAWANG
          </h2>

          {hasContactInfo && (
            <div className="text-[11px] text-slate-600 mt-1 space-y-0.5 leading-tight break-words">
              {settings.address && <p>{settings.address}</p>}
              <p>
                {settings.phone && <span>Telp/WA: {settings.phone}</span>}
                {settings.phone && settings.email && <span> &middot; </span>}
                {settings.email && <span>Email: {settings.email}</span>}
                {settings.website && <span> &middot; Web: {settings.website}</span>}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Garis Ganda Standar Surat Resmi (Tebal di atas, tipis di bawah) */}
      <div className="border-b-[3px] border-slate-900 w-full"></div>
      <div className="border-b border-slate-900 w-full pt-[2px] mb-4"></div>

      {/* Judul Laporan & Periode jika diberikan */}
      {reportTitle && (
        <div className="text-center my-3 px-2">
          <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-slate-900 break-words">
            {reportTitle}
          </h3>
          {reportPeriod && (
            <p className="text-xs font-semibold text-slate-600 mt-0.5">
              Periode: {reportPeriod}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
