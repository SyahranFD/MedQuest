import { useMemo } from 'react'
import { registerMessages, useT } from '@/lib/i18n'

registerMessages('clinic3d', {
  id: {
    labelPoli: 'Ruang poliklinik 3D',
    labelEr: 'Instalasi gawat darurat 3D',
    loading: 'Memuat ruangan 3D',
    fallbackNote: 'Tampilan 3D tidak tersedia di perangkat ini. Ini hanya ilustrasi.',
    selectPatient: 'Pilih pasien',
  },
  en: {
    labelPoli: '3D outpatient clinic room',
    labelEr: '3D emergency room',
    loading: 'Loading the 3D room',
    fallbackNote: '3D view is not available on this device. This is an illustration only.',
    selectPatient: 'Select patient',
  },
})

/** Scene copy in the active locale (namespace `clinic3d`). */
export function useClinicCopy() {
  const t = useT()
  return useMemo(
    () => ({
      labelPoli: t('clinic3d.labelPoli'),
      labelEr: t('clinic3d.labelEr'),
      loading: t('clinic3d.loading'),
      fallbackNote: t('clinic3d.fallbackNote'),
      selectPatient: t('clinic3d.selectPatient'),
    }),
    [t],
  )
}
