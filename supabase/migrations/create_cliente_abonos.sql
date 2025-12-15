-- Create table for tracking payment history (abonos)
create table if not exists public.cliente_abonos (
    id uuid not null default gen_random_uuid(),
    compra_id uuid not null references public.cliente_compras(id) on delete cascade,
    monto numeric not null default 0,
    fecha_abono timestamptz not null default now(),
    nota text,
    created_at timestamptz not null default now(),
    primary key (id)
);

-- RLS Policies (Enable Read/Write for authenticated users - assuming simple auth model or public for now based on existing patterns)
alter table public.cliente_abonos enable row level security;

create policy "Enable read access for all users" on public.cliente_abonos
    for select using (true);

create policy "Enable insert access for all users" on public.cliente_abonos
    for insert with check (true);

create policy "Enable update access for all users" on public.cliente_abonos
    for update using (true);

create policy "Enable delete access for all users" on public.cliente_abonos
    for delete using (true);
