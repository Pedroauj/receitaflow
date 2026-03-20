/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Você foi convidado para o ReceitaFlow</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>⬡ Receita<span style={brandAccent}>Flow</span></Text>
        <Heading style={h1}>Você foi convidado</Heading>
        <Text style={text}>
          Você foi convidado para participar do{' '}
          <Link href={siteUrl} style={link}>
            <strong>ReceitaFlow</strong>
          </Link>
          . Clique no botão abaixo para aceitar o convite e criar sua conta.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Aceitar convite
        </Button>
        <Text style={footer}>
          Se você não esperava este convite, pode ignorar este email com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const brand = { fontSize: '18px', fontWeight: 'bold' as const, color: '#18181A', margin: '0 0 28px' }
const brandAccent = { color: '#BA7517' }
const h1 = { fontSize: '22px', fontWeight: '600' as const, color: '#18181A', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#5F5E5A', lineHeight: '1.6', margin: '0 0 24px' }
const link = { color: '#BA7517', textDecoration: 'underline' }
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
