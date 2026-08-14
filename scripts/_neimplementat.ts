/**
 * `hotel-forge/package.json` declara `scripts/audit-only.ts` și `scripts/deploy.ts`,
 * care nu existau (vezi DECIZII.md). Un `npm run` care moare cu „file not found"
 * nu spune nimănui nimic.
 *
 * Comenzile din C3 sunt declarate în package.json de la T00, ca să existe interfața
 * completă de la început — dar până la task-ul lor răspund cu un mesaj care spune
 * exact ce lipsește și de unde vine.
 */
export function neimplementat(comanda: string, task: string, ce: string): never {
  process.stderr.write(
    `\n  npm run ${comanda} — încă neimplementat.\n\n` +
      `  Vine la ${task}: ${ce}\n` +
      `  Detalii: tasks/${task}-*.md\n\n`,
  )
  process.exit(1)
}
