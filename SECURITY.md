# Security Guidelines

## Environment Variables Security

### ✅ SECURE: Server-side only environment variables
- `DISPLAY_SIGNER_KEY` - Private key used for read-only operations, **NEVER expose to client**

### ✅ SECURE: Client-exposed environment variables
- `NEXT_PUBLIC_RPC_ENDPOINT` - RPC endpoint, safe to expose as it's public infrastructure

## Security Checklist

### Environment Variables
- [ ] All sensitive keys are in `.env` file (git-ignored)
- [ ] Only `NEXT_PUBLIC_*` prefixed variables are used in client-side code
- [ ] `DISPLAY_SIGNER_KEY` is only used in server-side API routes
- [ ] Environment variables are validated before use

### Code Security
- [ ] No private keys or sensitive data in source code
- [ ] Error messages don't expose internal system details
- [ ] API routes have proper input validation
- [ ] No sensitive operations in client-side components

### Build Security
- [ ] Run `npm run build` and verify no sensitive data in client bundles
- [ ] Check `.next/static/chunks/` for any accidentally exposed secrets

## Security Verification Commands

```bash
# Check for any sensitive data in built client bundles
findstr /s /i "DISPLAY_SIGNER" .next\static\*

# Should return no results if secure
```

## Incident Response

If `DISPLAY_SIGNER_KEY` is ever compromised:
1. Immediately rotate the private key
2. Update the `.env` file with new key
3. Redeploy the application
4. Review git history to ensure key was never committed

## Best Practices

1. **Never commit `.env` files** - they're git-ignored for a reason
2. **Use different keys for different environments** (dev/staging/prod)
3. **Regularly rotate private keys**
4. **Monitor for any unexpected exposure** in build artifacts
5. **Use least-privilege principle** - only give keys minimum required permissions 