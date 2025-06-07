export async function verifyWebhookSignature(
    body: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    try {
      // Parse signature header: "t=timestamp,v1=signature"
      const parts = signature.split(',');
      const timestamp = parts.find(p => p.startsWith('t='))?.slice(2);
      const sig = parts.find(p => p.startsWith('v1='))?.slice(3);
  
      if (!timestamp || !sig) {
        return false;
      }
  
      // Create expected signature
      const payload = `${timestamp}.${body}`;
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
  
      const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
      const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
  
      return expectedSignature === sig;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }