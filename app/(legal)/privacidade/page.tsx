"use client";

import { useRouter } from "next/navigation";
import { Screen, Header } from "@/components/ui/primitives";

// Rascunho técnico, fiel ao que o schema em supabase/schema.sql de fato
// coleta — não é parecer jurídico. Revisar com jurídico antes do launch,
// em especial o e-mail de contato abaixo (placeholder).
const CONTACT_EMAIL = "privacidade@fittracker.app";
const LAST_UPDATED = "5 de agosto de 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex flex-col gap-2 text-sm text-muted [&_strong]:text-text [&_strong]:font-medium">
        {children}
      </div>
    </div>
  );
}

export default function PrivacidadePage() {
  const router = useRouter();

  return (
    <Screen>
      <Header title="Política de privacidade" onBack={() => router.back()} />
      <p className="-mt-2 text-sm text-muted">Última atualização: {LAST_UPDATED}</p>

      <Section title="1. Quem trata seus dados">
        <p>
          O FitTracker (&quot;nós&quot;) é o controlador dos dados pessoais tratados neste
          app, nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018 — LGPD). Para
          falar sobre seus dados, escreva para{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-accent">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>

      <Section title="2. Quais dados coletamos">
        <p>
          <strong>Identificação:</strong> nome completo, e-mail, foto de perfil e o código
          de convite usado para vincular aluno e personal.
        </p>
        <p>
          <strong>Dados de saúde (categoria sensível):</strong> peso, altura, meta de peso,
          objetivo, nível de experiência, equipamentos disponíveis e limitações físicas que
          você informa no cadastro e no perfil. Por serem dados sensíveis, só os tratamos
          com base no seu consentimento explícito — o mesmo aceite desta política, dado na
          criação da conta.
        </p>
        <p>
          <strong>Treino e desempenho:</strong> programas, treinos e séries que você executa,
          cargas, repetições, duração e volume de cada sessão, e o histórico de peso corporal
          que você registra.
        </p>
        <p>
          <strong>Dados profissionais (personal trainer):</strong> número e UF do registro no
          CREF, usados para verificar a habilitação profissional.
        </p>
      </Section>

      <Section title="3. Para que usamos seus dados">
        <p>
          Para criar e manter sua conta, montar e acompanhar seus treinos, calcular seu
          progresso (calendário semanal, histórico, gráficos de peso) e — se você tiver um
          personal vinculado — permitir que ele acompanhe sua evolução.
        </p>
        <p>
          Não vendemos seus dados nem os usamos para publicidade de terceiros.
        </p>
      </Section>

      <Section title="4. Com quem compartilhamos">
        <p>
          <strong>Seu personal trainer</strong>, somente enquanto o vínculo entre vocês
          estiver ativo. Ele vê seu perfil, medidas, sessões e progresso para poder montar e
          ajustar seus programas. Ao sair da equipe (tela de Perfil), esse acesso é
          revogado.
        </p>
        <p>
          <strong>Supabase</strong>, nosso provedor de banco de dados e autenticação, que
          hospeda a infraestrutura sob contrato de processamento de dados.
        </p>
        <p>Não compartilhamos seus dados com mais ninguém.</p>
      </Section>

      <Section title="5. Por quanto tempo guardamos">
        <p>
          Enquanto sua conta existir. Ao excluir a conta, seu perfil e todos os dados
          vinculados a ele (medidas, treinos, sessões, histórico) são apagados em cascata do
          nosso banco.
        </p>
      </Section>

      <Section title="6. Seus direitos">
        <p>
          Você pode pedir acesso, correção, portabilidade ou exclusão dos seus dados, e
          revogar o consentimento dado aqui, a qualquer momento, pelo e-mail acima — conforme
          o art. 18 da LGPD. Dados básicos de perfil e medidas podem ser editados diretamente
          na tela de Perfil do app.
        </p>
      </Section>

      <Section title="7. Armazenamento no dispositivo">
        <p>
          O app guarda uma cópia local dos seus dados no armazenamento do navegador
          (localStorage), para funcionar offline como um PWA, e usa um service worker para
          isso. Esses dados locais são apagados ao limpar os dados do site ou desinstalar o
          app.
        </p>
      </Section>
    </Screen>
  );
}
