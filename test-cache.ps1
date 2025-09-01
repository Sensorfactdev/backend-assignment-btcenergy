# Test the Redis cache functionality
$endpoint = "http://127.0.0.1:4000/graphql"

Write-Host "Testing Bitcoin Energy API Cache System" -ForegroundColor Green
Write-Host ""

# Test 1: Check cache stats
Write-Host "1. Checking cache statistics..." -ForegroundColor Yellow

$cacheStatsQuery = @{
    query = "query { cacheStats { redisConnected memoryEntries connectionAttempted } }"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $endpoint -Method POST -ContentType "application/json" -Body $cacheStatsQuery
    $stats = $response.data.cacheStats
    
    if ($stats.redisConnected) {
        Write-Host "   Redis Connected: YES" -ForegroundColor Green
    } else {
        Write-Host "   Redis Connected: NO" -ForegroundColor Red
    }
    
    Write-Host "   Memory Entries: $($stats.memoryEntries)"
    
    if ($stats.connectionAttempted) {
        Write-Host "   Connection Attempted: YES" -ForegroundColor Green
    } else {
        Write-Host "   Connection Attempted: NO" -ForegroundColor Red
    }
    
    if (-not $stats.redisConnected -and $stats.connectionAttempted) {
        Write-Host "   Status: Using in-memory cache fallback (Redis not available)" -ForegroundColor Cyan
    } elseif (-not $stats.connectionAttempted) {
        Write-Host "   Status: Using in-memory cache only (No Redis configuration)" -ForegroundColor Cyan
    } else {
        Write-Host "   Status: Using Redis cache with in-memory fallback" -ForegroundColor Cyan
    }
} catch {
    Write-Host "Error checking cache stats: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. Testing a simple query..." -ForegroundColor Yellow

$helloQuery = @{
    query = "query { hello }"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $endpoint -Method POST -ContentType "application/json" -Body $helloQuery
    Write-Host "   Hello query result: $($response.data.hello)" -ForegroundColor Green
} catch {
    Write-Host "   Error with hello query: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Cache system test completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Blue
Write-Host "   - Redis: Configure REDIS_URL or REDIS_HOST in .env file"
Write-Host "   - Database: 0"
Write-Host "   - Fallback: Always available in-memory cache"
Write-Host "   - Monitoring: Use cacheStats GraphQL query"
