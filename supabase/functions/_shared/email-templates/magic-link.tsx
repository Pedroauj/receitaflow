/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu link de acesso ao ReceitaFlow</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>⬡ Receita<span style={brandAccent}>Flow</span></Text>
        <Heading style={h1}>Seu link de acesso</Heading>
        <Text style={text}>
          Clique no botão abaixo para acessar o ReceitaFlow. Este link expira em breve.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Acessar
        </Button>
        <Text style={footer}>
          Se você não solicitou este link, pode ignorar este email com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const brand = { fontSize: '18px', fontWeight: 'bold' as const, color: '#18181A', margin: '0 0 28px' }
const brandAccent = { color: '#BA7517' }
const h1 = { fontSize: '22px', fontWeight: '600' as const, color: '#18181A', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#5F5E5A', lineHeight: '1.6', margin: '0 0 24px' }
const button = {
  backgroundColor: '#BA7517',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '500' as const,
  borderRadius: '12px',
  padding: '12px 24px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#888780', margin: '32px 0 0', lineHeight: '1.5' }
