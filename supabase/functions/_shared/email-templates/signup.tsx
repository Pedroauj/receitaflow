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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme seu email no ReceitaFlow</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>⬡ Receita<span style={brandAccent}>Flow</span></Text>
        <Heading style={h1}>Confirme seu email</Heading>
        <Text style={text}>
          Obrigado por criar sua conta no{' '}
          <Link href={siteUrl} style={link}>
            <strong>ReceitaFlow</strong>
          </Link>
          !
        </Text>
        <Text style={text}>
          Confirme seu endereço de email (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) clicando no botão abaixo:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Verificar email
        </Button>
        <Text style={footer}>
          Se você não criou uma conta, pode ignorar este email com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
