import { createFileRoute, notFound } from '@tanstack/react-router'
import { Plus, Search } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { MarketingFooter } from '@/components/shell/marketing-footer'
import { MarketingNav } from '@/components/shell/marketing-nav'
import { EmptyState } from '@/components/page/empty-state'
import { ErrorState } from '@/components/page/error-state'
import { PageBody } from '@/components/page/page-body'
import { PageHeader } from '@/components/page/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CountUp } from '@/components/ui/count-up'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import { Kbd } from '@/components/ui/kbd'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Reveal, RevealGroup } from '@/components/ui/reveal'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ScrollWords } from '@/components/ui/scroll-words'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { EMOTIONS } from '@/lib/emotion'
import { useT } from '@/lib/i18n'
import { useUiStore } from '@/stores/ui'

export const Route = createFileRoute('/lab/ui')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  staticData: { title: 'Lab UI' },
  component: LabUi,
})

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 py-8">
      <h2 className="font-display text-heading-section font-semibold text-ink-1">{title}</h2>
      {children}
    </section>
  )
}

function LabUi() {
  const t = useT()
  const [progress, setProgress] = useState(64)
  const reduced = useUiStore((s) => s.reducedMotion)
  const setReduced = useUiStore((s) => s.setReducedMotion)

  return (
    <>
      <MarketingNav />
      <PageBody wide>
        <PageHeader
          eyebrow={<Badge variant="neutral">Dev only</Badge>}
          title="Design system"
          description="Every primitive and the motion kit on the real tokens."
          actions={
            <div className="flex items-center gap-2">
              <Label htmlFor="rm">Reduce motion</Label>
              <Switch
                id="rm"
                checked={reduced === 'reduce'}
                onCheckedChange={(on) => setReduced(on ? 'reduce' : 'system')}
              />
            </div>
          }
        />

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="warning">Warning</Button>
            <Button variant="link">Link</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="lg">{t('nav.tryDemo')}</Button>
            <Button size="icon" variant="secondary" aria-label="Add">
              <Plus />
            </Button>
          </div>
        </Section>

        <Section title="Badges">
          <div className="flex flex-wrap gap-2">
            <Badge variant="danger">{t('status.danger')}</Badge>
            <Badge variant="warning">{t('status.warning')}</Badge>
            <Badge variant="success">{t('status.success')}</Badge>
            <Badge variant="neutral">{t('status.neutral')}</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="category" category="infection">Infeksi</Badge>
            <Badge variant="category" category="cardio">Kardio</Badge>
            <Badge variant="category" category="endocrine">Endokrin</Badge>
            <Badge variant="category" category="pulmo">Paru</Badge>
            <Badge variant="category" category="neuro">Saraf</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {EMOTIONS.map((e) => (
              <Badge key={e} variant="neutral">{t(`emotion.${e}`)}</Badge>
            ))}
          </div>
        </Section>

        <Section title="Cards">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Surface</CardTitle>
                <CardDescription>Hairline border, no shadow.</CardDescription>
              </CardHeader>
            </Card>
            <Card tone="panel">
              <CardHeader>
                <CardTitle>Panel</CardTitle>
                <CardDescription>Tonal shift.</CardDescription>
              </CardHeader>
            </Card>
            <Card tone="green">
              <CardHeader>
                <CardTitle>Tint green</CardTitle>
                <CardDescription>Illustration field.</CardDescription>
              </CardHeader>
            </Card>
            <Card tone="coral">
              <CardHeader>
                <CardTitle>Tint coral</CardTitle>
                <CardDescription>Illustration field.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </Section>

        <Section title="Form controls">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nama pasien</Label>
              <Input id="name" placeholder="Contoh: Ibu Sari" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bad">Invalid</Label>
              <Input id="bad" aria-invalid defaultValue="salah" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="spec">Spesialisasi</Label>
              <Select defaultValue="cardio">
                <SelectTrigger id="spec">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="infection">Infeksi</SelectItem>
                  <SelectItem value="cardio">Kardiologi</SelectItem>
                  <SelectItem value="pulmo">Paru</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="sw" defaultChecked />
              <Label htmlFor="sw">Mode hemat grafis</Label>
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="note">Catatan</Label>
              <Textarea id="note" placeholder="Tulis catatan anamnesis" />
            </div>
          </div>
        </Section>

        <Section title="Tabs, progress, separator, kbd">
          <Tabs defaultValue="a">
            <TabsList>
              <TabsTrigger value="a">Anamnesis</TabsTrigger>
              <TabsTrigger value="b">Pemeriksaan</TabsTrigger>
              <TabsTrigger value="c">Diagnosis</TabsTrigger>
            </TabsList>
            <TabsContent value="a" className="text-body-s text-ink-2">Isi tab anamnesis.</TabsContent>
            <TabsContent value="b" className="text-body-s text-ink-2">Isi tab pemeriksaan.</TabsContent>
            <TabsContent value="c" className="text-body-s text-ink-2">Isi tab diagnosis.</TabsContent>
          </Tabs>
          <div className="flex items-center gap-4">
            <Progress value={progress} className="max-w-md" aria-label="Progres" />
            <Button size="sm" variant="secondary" onClick={() => setProgress((p) => (p + 20) % 120)}>
              +20
            </Button>
          </div>
          <Separator />
          <p className="text-body-s text-ink-2">
            Tekan <Kbd>Ctrl</Kbd> <Kbd>K</Kbd> untuk mencari <Search className="inline size-4" />
          </p>
        </Section>

        <Section title="Overlays and scroll">
          <div className="flex flex-wrap items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">Buka dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Akhiri sesi?</DialogTitle>
                  <DialogDescription>Skor akan dihitung dari percakapan sejauh ini.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="ghost">{t('common.cancel')}</Button>
                  </DialogClose>
                  <Button>{t('common.confirm')}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary">Tooltip</Button>
              </TooltipTrigger>
              <TooltipContent>Hover atau fokus</TooltipContent>
            </Tooltip>
          </div>
          <ScrollArea className="h-32 max-w-sm rounded-sm border border-line bg-surface">
            <ul className="flex flex-col gap-1 p-3 text-body-s text-ink-2">
              {Array.from({ length: 14 }, (_, i) => (
                <li key={i}>Baris data ke-{i + 1}</li>
              ))}
            </ul>
          </ScrollArea>
        </Section>

        <Section title="Skeleton and states">
          <div className="grid gap-3 md:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <EmptyState action={<Button variant="secondary">{t('common.start')}</Button>} />
            <ErrorState onRetry={() => undefined} />
          </div>
        </Section>

        <Section title="Motion kit">
          <ScrollWords
            as="h3"
            className="text-heading-page font-bold text-ink-1"
            text="Latihan pasien AI yang terasa nyata untuk setiap koas di Indonesia."
          />
          <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [128, 'Kasus sintetis'],
              [8, 'Emosi pasien'],
              [96, 'Persen sitasi valid'],
              [1.2, 'Detik respon'],
            ].map(([n, label]) => (
              <Reveal key={label}>
                <Card tone="panel">
                  <p className="font-display text-heading-page font-bold text-ink-1">
                    <CountUp to={n as number} decimals={n === 1.2 ? 1 : 0} />
                  </p>
                  <p className="text-body-s text-ink-2">{label}</p>
                </Card>
              </Reveal>
            ))}
          </RevealGroup>
          <Reveal>
            <p className="text-body text-ink-2">Satu Reveal tunggal, fade-up 32px, 750ms.</p>
          </Reveal>
        </Section>
      </PageBody>
      <MarketingFooter />
    </>
  )
}
