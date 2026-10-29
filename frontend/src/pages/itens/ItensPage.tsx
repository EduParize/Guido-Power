import { useMemo, useState } from 'react'
import { formatBRL } from '../../shared/lib/money.ts'
import { matchesQuery } from '../../shared/lib/search.ts'
import { Alert, Button, Card, DataTable, EmptyState, LoadingState, PageHeader, SearchInput, cn } from '../../shared/ui'
import type { DataColumn } from '../../shared/ui'
import type { CatalogItem, LaborCatalogItem } from '../../features/budget/catalog.ts'
import { useItemCatalog } from '../../features/budget/useItemCatalog'

type Tab = 'pecas' | 'mao-de-obra'

const usosColumn: DataColumn<CatalogItem> = {
  key: 'usos',
  header: 'Usos',
  className: 'w-28 text-right tabular-nums',
  cell: (i) => i.usos,
}
const descricaoColumn: DataColumn<CatalogItem> = {
  key: 'descricao',
  header: 'Descrição',
  cell: (i) => <span className="font-semibold">{i.descricao}</span>,
}
const PECAS_COLUMNS: DataColumn<CatalogItem>[] = [
  descricaoColumn,
  { key: 'valor', header: 'Último valor', className: 'w-44 text-right tabular-nums', cell: (i) => formatBRL(i.valorUnitario) },
  usosColumn,
]
const LABOR_COLUMNS: DataColumn<LaborCatalogItem>[] = [
  descricaoColumn,
  {
    key: 'valor',
    header: 'Último valor',
    className: 'w-56 text-right tabular-nums',
    cell: (i) => (i.porHora ? `${formatBRL(i.valorUnitario)}/h` : `${formatBRL(i.valorUnitario)} (fixo)`),
  },
  usosColumn,
]

export function ItensPage() {
  const { parts, labor, isLoading, error, reload } = useItemCatalog()
  const [tab, setTab] = useState<Tab>('pecas')
  const [query, setQuery] = useState('')

  const pecas = useMemo(() => parts.filter((i) => matchesQuery(query, i.descricao)), [parts, query])
  const maoDeObra = useMemo(() => labor.filter((i) => matchesQuery(query, i.descricao)), [labor, query])
  const loading = isLoading && parts.length === 0 && labor.length === 0

  return (
    <>
      <PageHeader
        title="Itens e peças"
        description="Catálogo montado a partir dos itens dos orçamentos: o que já foi orçado, pelo último valor. Ao criar um orçamento, essas peças aparecem como sugestão."
      />
      {loading ? (
        <Card><LoadingState label="Carregando catálogo…" /></Card>
      ) : error && parts.length === 0 && labor.length === 0 ? (
        <Alert tone="danger" title="Não foi possível carregar o catálogo" action={<Button size="sm" variant="secondary" onClick={reload}>Tentar novamente</Button>}>
          {error}
        </Alert>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div role="tablist" aria-label="Tipo de item" className="inline-flex rounded-lg border border-border-strong bg-surface p-1">
              <TabButton active={tab === 'pecas'} onClick={() => setTab('pecas')} label="Peças" count={parts.length} />
              <TabButton active={tab === 'mao-de-obra'} onClick={() => setTab('mao-de-obra')} label="Mão de obra" count={labor.length} />
            </div>
            <SearchInput value={query} onChange={setQuery} label="Buscar itens" placeholder="Buscar por descrição" className="sm:max-w-md" />
          </div>
          <div role="tabpanel" aria-label={tab === 'pecas' ? 'Peças' : 'Mão de obra'}>
            {tab === 'pecas' ? (
              <DataTable
                caption="Peças (A–Z)"
                columns={PECAS_COLUMNS}
                rows={pecas}
                rowKey={(i) => i.key}
                empty={<Vazio filtrando={query !== '' && parts.length > 0} tipo="peça" onClear={() => setQuery('')} />}
              />
            ) : (
              <DataTable
                caption="Mão de obra (A–Z)"
                columns={LABOR_COLUMNS}
                rows={maoDeObra}
                rowKey={(i) => i.key}
                empty={<Vazio filtrando={query !== '' && labor.length > 0} tipo="serviço" onClear={() => setQuery('')} />}
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}

function TabButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-md px-4 text-[15px] font-semibold transition-colors',
        active ? 'bg-primary text-primary-contrast' : 'text-text hover:bg-surface-muted',
      )}
    >
      {label}
      <span className="text-sm tabular-nums opacity-80">{count}</span>
    </button>
  )
}

function Vazio({ filtrando, tipo, onClear }: { filtrando: boolean; tipo: string; onClear: () => void }) {
  return filtrando ? (
    <EmptyState icon="search" title="Nada encontrado" description="Tente outro termo de busca." action={<Button variant="secondary" onClick={onClear}>Limpar busca</Button>} />
  ) : (
    <EmptyState icon="item" title={`Nenhum ${tipo} ainda`} description={`Os itens aparecem aqui depois que você os lança em um orçamento.`} />
  )
}
