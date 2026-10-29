/** Foca o primeiro campo marcado como inválido dentro de `root` (chame após atualizar os erros). */
export function focusFirstInvalid(root: HTMLElement | null): void {
  window.requestAnimationFrame(() => {
    const target = root?.querySelector<HTMLElement>('[aria-invalid="true"]')
    if (!target) return
    target.focus()
    target.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })
}
