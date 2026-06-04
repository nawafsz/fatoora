export async function GET() {
  const text = `Contact: mailto:security@fatoora.sa
Contact: https://fatoora.onrender.com/contact
Preferred-Languages: ar, en
Canonical: https://fatoora.onrender.com/.well-known/security.txt
Policy: https://fatoora.sa/security-policy
Encryption: https://fatoora.sa/pgp-key.txt
Expires: 2027-06-05T00:00:00.000Z
Acknowledgments: https://fatoora.sa/hall-of-fame
`;

  return new Response(text, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
