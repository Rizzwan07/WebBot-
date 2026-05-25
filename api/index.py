from mangum import Mangum
from main import app

# Vercel serverless handler - must be named 'handler'
handler = Mangum(app, lifespan="off")

# Also export as default for Vercel
def main(request, context=None):
    return handler(request, context)
