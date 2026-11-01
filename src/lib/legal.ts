// Angaben für Impressum und Datenschutzerklärung. Die c/o-Adresse kommt beim Bauen aus der
// Umgebung (Repo-Variable IMPRESSUM_ADDRESS), damit sie nicht im Quellcode steht.
export function impressumAddress(env: { IMPRESSUM_ADDRESS?: string }): string | null {
  const value = (env.IMPRESSUM_ADDRESS ?? '').trim()
  return value === '' ? null : value
}
