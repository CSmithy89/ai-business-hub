import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface VerificationEmailProps {
  verificationUrl: string
  userName?: string
}

export function VerificationEmail({ verificationUrl, userName }: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address for HYVVE</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Verify your email address</Heading>
          {userName && (
            <Text style={text}>
              Hi {userName},
            </Text>
          )}
          <Text style={text}>
            Thanks for signing up for HYVVE! To complete your registration, please verify your
            email address by clicking the button below:
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={verificationUrl}>
              Verify Email Address
            </Button>
          </Section>
          <Text style={text}>
            Or copy and paste this URL into your browser:
          </Text>
          <Link href={verificationUrl} style={link}>
            {verificationUrl}
          </Link>
          <Text style={footer}>
            This link will expire in 24 hours. If you didn&apos;t create an account with HYVVE, you can
            safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default VerificationEmail

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 24px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#FF6B6B',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
}

const link = {
  color: '#FF6B6B',
  fontSize: '14px',
  textDecoration: 'underline',
  margin: '0 24px',
  wordBreak: 'break-all' as const,
}

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '32px 24px 0',
}
