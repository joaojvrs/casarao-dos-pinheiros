import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Baby,
  Bed,
  BedDouble,
  CalendarDays,
  Check,
  ConciergeBell,
  CreditCard,
  IdCard,
  LogIn,
  Mail,
  MapPin,
  Minus,
  Phone,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createBooking as persistBooking } from '../services/bookings';
import type { AccommodationOption, BookingExtraInput, CreateBookingResult } from '../types/booking';

const ACCOMMODATIONS: AccommodationOption[] = [
  {
    id: 'suica',
    name: 'Cabana Suica',
    image: '/1761695050182-Cabana_Suica_frontal_1.jpg',
    capacity: 4,
    rate: 1680,
    mood: 'Vista para cachoeira, duas suites, ofuro privativo e cafe incluso.',
  },
  {
    id: 'mata',
    name: 'Cabana da Mata',
    image: '/1761873782563-CabanaMata_Frente_2.jpg',
    capacity: 4,
    rate: 1580,
    mood: 'Deck voltado para piscinas naturais, cozinha equipada e silencio de mata.',
  },
  {
    id: 'casarao',
    name: 'Quarto do Casarao',
    image: '/1761997461000-DSC02126-2.jpg',
    capacity: 3,
    rate: 920,
    mood: 'Charme historico, cama queen, cama de solteiro e acesso as areas comuns.',
  },
];

const EXPERIENCES = ['Cafe da manha no deck', 'Massagem relaxante', 'Passeio de quadriciclo', 'Jantar romantico', 'Piscinas aquecidas'];

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

export function BookingPortal({ onBack }: { onBack: () => void }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const today = useMemo(() => new Date(), []);
  const [accommodation, setAccommodation] = useState(ACCOMMODATIONS[0]);
  const [checkIn, setCheckIn] = useState(addDays(today, 7));
  const [checkOut, setCheckOut] = useState(addDays(today, 9));
  const [guests, setGuests] = useState(2);
  const [mattress, setMattress] = useState(0);
  const [crib, setCrib] = useState(0);
  const [selectedExperiences, setSelectedExperiences] = useState<string[]>(['Cafe da manha no deck']);
  const [guestName, setGuestName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [cardHolder, setCardHolder] = useState('');
  const [cardLastFour, setCardLastFour] = useState('');
  const [installments, setInstallments] = useState(1);
  const [created, setCreated] = useState<CreateBookingResult | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const nights = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
  const extrasTotal = mattress * 120 + crib * 80;
  const experienceTotal = selectedExperiences.length * 160;
  const subtotal = accommodation.rate * nights;
  const total = subtotal + extrasTotal + experienceTotal;
  const accountEmail = auth.user?.email || '';
  const canBook = auth.authenticated && !auth.loading;

  useEffect(() => {
    if (!auth.user) return;
    setEmail(auth.user.email || '');
    setGuestName(String(auth.user.user_metadata?.full_name || ''));
    setPhone(String(auth.user.user_metadata?.phone || ''));
  }, [auth.user]);

  const toggleExperience = (item: string) => {
    setSelectedExperiences(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const createBooking = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setCreated(null);

    if (!canBook) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (paymentMethod === 'credit_card' && !/^\d{4}$/.test(cardLastFour)) {
      setError('Informe os 4 ultimos digitos do cartao para concluir o pagamento mockado.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);

    try {
      const extras = ([
        { code: 'extra_mattress', name: 'Adicional de colchao', quantity: mattress, unitPrice: 120 },
        { code: 'crib', name: 'Adicional de berco', quantity: crib, unitPrice: 80 },
      ] satisfies BookingExtraInput[]).filter(extra => extra.quantity > 0);

      const booking = await persistBooking({
        accommodationId: accommodation.id,
        checkIn,
        checkOut,
        guestsCount: guests,
        guest: { name: guestName, cpf, phone, email: accountEmail },
        extras,
        experiences: selectedExperiences,
        payment: {
          method: paymentMethod,
          holderName: cardHolder,
          lastFour: cardLastFour,
          installments,
        },
        notes,
      });
      setCreated(booking);
      await auth.refreshAccess();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel criar a hospedagem.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#20140d]">
      <header className="relative min-h-[52vh] overflow-hidden bg-[#101815] text-white">
        <img src={accommodation.image} alt={accommodation.name} className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/82 via-black/45 to-black/15" />

        <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-14 px-5 py-6 md:px-10">
          <button onClick={onBack} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-md transition hover:bg-white/18">
            <ArrowLeft size={18} />
          </button>

          <section className="max-w-3xl pb-10">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.34em] text-[#d7b98d]">Reservas do hotel</p>
            <h1 className="font-serif text-5xl leading-[0.98] md:text-7xl">Gerar agendamento completo.</h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-white/72 md:text-base">
              Tela operacional de alto padrao com validacao de disponibilidade, regras de capacidade e gravacao segura da hospedagem no banco de dados.
            </p>
          </section>
        </div>
      </header>

      <form onSubmit={createBooking} className="mx-auto grid max-w-7xl gap-6 px-5 py-7 md:grid-cols-[1fr_380px] md:px-10 md:py-10">
        <section className="space-y-6">
          {created && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-950">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white"><Check size={17} /></span>
                <div>
                  <p className="font-semibold">Hospedagem paga e confirmada: {created.confirmationCode}</p>
                  <p className="mt-1 text-emerald-800">Total oficial: {BRL.format(created.total / 100)}. Conta liberada como hospede.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-3">
                <MiniStep text="Pagamento mockado aprovado" />
                <MiniStep text={created.emailStatus === 'sent' ? 'E-mail enviado' : created.emailStatus === 'failed' ? 'E-mail pendente de reenvio' : 'E-mail registrado no mock'} />
                <MiniStep text="Portal do hospede liberado" />
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900">
              {error}
            </motion.div>
          )}

          {!canBook && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">Entre na sua conta antes de finalizar.</p>
                  <p className="mt-1 text-amber-800">A hospedagem agora fica vinculada ao seu login. Depois do pagamento mockado, sua conta vira hospede automaticamente.</p>
                </div>
                <button type="button" onClick={() => navigate('/login', { state: { from: location.pathname } })} className="flex items-center justify-center gap-2 rounded-lg bg-[#20140d] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white">
                  <LogIn size={15} />
                  Entrar
                </button>
              </div>
            </motion.div>
          )}

          <Panel title="Acomodacao" icon={BedDouble}>
            <div className="grid gap-3 lg:grid-cols-3">
              {ACCOMMODATIONS.map(item => {
                const active = item.id === accommodation.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setAccommodation(item)}
                    className={`overflow-hidden rounded-lg border text-left transition ${active ? 'border-[#9d7a4f] bg-white shadow-lg' : 'border-black/8 bg-white/70 hover:border-[#c3a37a]'}`}
                  >
                    <img src={item.image} alt="" className="h-32 w-full object-cover" />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-serif text-xl">{item.name}</h3>
                        {active && <Check size={17} className="mt-1 text-[#3a6b4a]" />}
                      </div>
                      <p className="mt-2 min-h-12 text-xs leading-5 text-black/55">{item.mood}</p>
                      <p className="mt-4 text-sm font-semibold">{BRL.format(item.rate)} <span className="font-normal text-black/40">/ diaria</span></p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel title="Dados da reserva" icon={CalendarDays}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Check-in" icon={CalendarDays}><input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} /></Field>
              <Field label="Check-out" icon={CalendarDays}><input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} /></Field>
              <Field label="Hospedes" icon={Users}><input type="number" min={1} max={accommodation.capacity + mattress} value={guests} onChange={e => setGuests(Number(e.target.value))} /></Field>
            </div>
          </Panel>

          <Panel title="Hospede principal" icon={ConciergeBell}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome" icon={Users}><input value={guestName} onChange={e => setGuestName(e.target.value)} /></Field>
              <Field label="CPF" icon={IdCard}><input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" /></Field>
              <Field label="Telefone" icon={Phone}><input value={phone} onChange={e => setPhone(e.target.value)} /></Field>
              <Field label="E-mail da conta" icon={Mail}><input type="email" value={accountEmail || email} readOnly /></Field>
            </div>
          </Panel>

          <Panel title="Adicionais e experiencias" icon={Sparkles}>
            <div className="grid gap-4 lg:grid-cols-2">
              <Stepper icon={Bed} title="Adicional de colchao" desc="Colchao extra preparado com enxoval completo." value={mattress} setValue={setMattress} />
              <Stepper icon={Baby} title="Adicional de berco" desc="Berco higienizado, roupa de cama infantil e manta." value={crib} setValue={setCrib} />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {EXPERIENCES.map(item => {
                const active = selectedExperiences.includes(item);
                return (
                  <button key={item} type="button" onClick={() => toggleExperience(item)} className={`rounded-full border px-4 py-2 text-xs font-medium transition ${active ? 'border-[#3a6b4a] bg-[#3a6b4a] text-white' : 'border-black/10 bg-white text-black/60 hover:border-[#c3a37a]'}`}>
                    {item}
                  </button>
                );
              })}
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.24em] text-black/35">Observacoes internas</span>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="w-full resize-none rounded-lg border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#9d7a4f]" />
            </label>
          </Panel>

          <Panel title="Pagamento mockado" icon={CreditCard}>
            <div className="grid gap-3 md:grid-cols-2">
              <button type="button" onClick={() => setPaymentMethod('pix')} className={`rounded-lg border p-4 text-left transition ${paymentMethod === 'pix' ? 'border-[#3a6b4a] bg-emerald-50' : 'border-black/10 bg-white hover:border-[#c3a37a]'}`}>
                <p className="text-sm font-semibold">PIX aprovado na hora</p>
                <p className="mt-1 text-xs leading-5 text-black/50">Gera uma chave demonstrativa e confirma a hospedagem sem gateway real.</p>
              </button>
              <button type="button" onClick={() => setPaymentMethod('credit_card')} className={`rounded-lg border p-4 text-left transition ${paymentMethod === 'credit_card' ? 'border-[#3a6b4a] bg-emerald-50' : 'border-black/10 bg-white hover:border-[#c3a37a]'}`}>
                <p className="text-sm font-semibold">Cartao de credito mockado</p>
                <p className="mt-1 text-xs leading-5 text-black/50">Valida somente os dados basicos e registra pagamento aprovado.</p>
              </button>
            </div>

            {paymentMethod === 'pix' ? (
              <div className="mt-4 rounded-lg border border-black/8 bg-[#faf7f0] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-black/35">Chave PIX demonstrativa</p>
                <p className="mt-2 font-mono text-sm text-black/65">pix.mock.casarao.{accommodation.id}.{checkIn}</p>
              </div>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <Field label="Nome no cartao" icon={Users}><input value={cardHolder} onChange={e => setCardHolder(e.target.value)} /></Field>
                <Field label="Ultimos 4 digitos" icon={CreditCard}><input value={cardLastFour} onChange={e => setCardLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="1234" /></Field>
                <Field label="Parcelas" icon={CreditCard}><input type="number" min={1} max={6} value={installments} onChange={e => setInstallments(Math.min(6, Math.max(1, Number(e.target.value))))} /></Field>
              </div>
            )}
          </Panel>
        </section>

        <aside className="self-start rounded-lg border border-black/8 bg-[#151d18] p-5 text-white shadow-2xl md:sticky md:top-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d7b98d]">Resumo</p>
              <h2 className="mt-1 font-serif text-3xl">{accommodation.name}</h2>
            </div>
            <ShieldCheck className="text-[#d7b98d]" size={25} />
          </div>

          <div className="space-y-4 py-5 text-sm text-white/72">
            <SummaryRow icon={CalendarDays} label={`${nights} diaria${nights > 1 ? 's' : ''}`} value={`${checkIn} ate ${checkOut}`} />
            <SummaryRow icon={Users} label="Hospedes" value={`${guests} pessoa${guests > 1 ? 's' : ''}`} />
            <SummaryRow icon={MapPin} label="Local" value="Casarao Vale do Eden Reserva" />
          </div>

          <div className="space-y-3 border-t border-white/10 py-5 text-sm">
            <PriceRow label="Hospedagem" value={subtotal} />
            <PriceRow label="Adicionais" value={extrasTotal} />
            <PriceRow label="Experiencias" value={experienceTotal} />
          </div>

          <div className="border-t border-white/10 pt-5">
            <div className="flex items-end justify-between">
              <span className="text-sm text-white/55">Total previsto</span>
              <strong className="font-serif text-3xl font-normal">{BRL.format(total)}</strong>
            </div>
            <button type="submit" disabled={submitting || auth.loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#d7b98d] py-4 text-xs font-bold uppercase tracking-[0.22em] text-[#15100b] transition hover:bg-[#e4caa4] disabled:cursor-not-allowed disabled:opacity-60">
              <CreditCard size={16} />
              {!canBook ? 'Entrar para reservar' : submitting ? 'Processando...' : `Pagar com ${paymentMethod === 'pix' ? 'PIX' : 'cartao'}`}
            </button>
            <p className="mt-3 text-xs leading-5 text-white/42">Pagamento temporariamente mockado. A confirmacao libera o Portal do Hospede e registra o e-mail de instrucoes.</p>
          </div>
        </aside>
      </form>
    </main>
  );
}

function MiniStep({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2">
      <Check size={14} className="text-emerald-700" />
      <span className="text-xs font-medium">{text}</span>
    </div>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-black/8 bg-white/78 p-5 shadow-sm backdrop-blur md:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#efe4d4] text-[#735333]"><Icon size={18} /></span>
        <h2 className="font-serif text-2xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: LucideIcon; children: React.ReactElement<{ className?: string }> }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-black/35"><Icon size={13} />{label}</span>
      {React.cloneElement(children, {
        className: 'h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-[#9d7a4f]',
      })}
    </label>
  );
}

function Stepper({ icon: Icon, title, desc, value, setValue }: { icon: LucideIcon; title: string; desc: string; value: number; setValue: (value: number) => void }) {
  return (
    <div className="rounded-lg border border-black/8 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f7f1e8] text-[#735333]"><Icon size={18} /></span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-black/50">{desc}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setValue(Math.max(0, value - 1))} className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 hover:bg-black/5"><Minus size={14} /></button>
          <span className="w-5 text-center text-sm font-bold">{value}</span>
          <button type="button" onClick={() => setValue(Math.min(3, value + 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#20140d] text-white hover:bg-[#3a2a1f]"><Plus size={14} /></button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <Icon size={16} className="mt-0.5 text-[#d7b98d]" />
      <div>
        <p className="text-white">{label}</p>
        <p className="text-xs text-white/45">{value}</p>
      </div>
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-white/70">
      <span>{label}</span>
      <span className="text-white">{BRL.format(value)}</span>
    </div>
  );
}
