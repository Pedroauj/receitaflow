/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu código de verificação do ReceitaFlow</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>⬡ Receita<span style={brandAccent}>Flow</span></Text>
        <Heading style={h1}>Código de verificação</Heading>
        <Text style={text}>Use o código abaixo para confirmar sua identidade:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Este código expira em breve. Se você não solicitou, pode ignorar este email com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const brand = { fontSize: '18px', fontWeight: 'bold' as const, color: '#18181A', margin: '0 0 28px' }
const brandAccent = { color: '#BA7517' }
const h1 = { fontSize: '22px', fontWeight: '600' as const, color: '#18181A', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#5F5E5A', lineHeight: '1.6', margin: '0 0 24px' }
const codeStyle = {
  fontFamily: "'SF Mono', 'Fira Code', Courier, monospace",
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#BA7517',
  letterSpacing: '4px',
  margin: '0 0 32px',
}
const footer = { fontSize: '12px', color: '#888780', margin: '32px 0 0', lineHeight: '1.5' }
