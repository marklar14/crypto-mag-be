import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Timeframe } from '../src/real-time-signals/enums/timeframe.enum';
import { SignalType, SignalStrength } from '../src/real-time-signals/types/signal-types';

describe('RealTimeSignals (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/api/real-time-signals (GET)', () => {
    it('should return real-time signals with default parameters', () => {
      return request(app.getHttpServer())
        .get('/api/real-time-signals')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('signals');
          expect(res.body).toHaveProperty('thresholds');
          expect(res.body).toHaveProperty('scanTime');
          expect(res.body).toHaveProperty('metadata');
          expect(Array.isArray(res.body.signals)).toBe(true);
          expect(typeof res.body.metadata.totalSignals).toBe('number');
        });
    });

    it('should accept custom query parameters', () => {
      return request(app.getHttpServer())
        .get('/api/real-time-signals')
        .query({
          timeframes: 'tf1m,tf5m',
          threshold: 75,
          limit: 10,
          adaptiveThresholds: 'true',
          tickAnalysis: 'false',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.signals.length).toBeLessThanOrEqual(10);
        });
    });

    it('should handle invalid threshold values', () => {
      return request(app.getHttpServer())
        .get('/api/real-time-signals')
        .query({
          threshold: 30, // Pod minimem 40
        })
        .expect(400); // Bad Request
    });

    it('should handle invalid limit values', () => {
      return request(app.getHttpServer())
        .get('/api/real-time-signals')
        .query({
          limit: 150, // Nad maximem 100
        })
        .expect(400); // Bad Request
    });

    it('should handle invalid timeframe values', () => {
      return request(app.getHttpServer())
        .get('/api/real-time-signals')
        .query({
          timeframes: 'invalid,tf1m',
        })
        .expect(400); // Bad Request
    });

    it('should filter signals by threshold correctly', () => {
      return request(app.getHttpServer())
        .get('/api/real-time-signals')
        .query({
          threshold: 90, // Vysoký threshold
          limit: 20,
        })
        .expect(200)
        .expect((res) => {
          // Všechny signály by měly mít confidence >= 90
          res.body.signals.forEach((signal: any) => {
            expect(signal.confidence).toBeGreaterThanOrEqual(90);
          });
        });
    });

    it('should respect limit parameter', () => {
      return request(app.getHttpServer())
        .get('/api/real-time-signals')
        .query({
          limit: 5,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.signals.length).toBeLessThanOrEqual(5);
        });
    });

    it('should include tick analysis for tf1m timeframe', () => {
      return request(app.getHttpServer())
        .get('/api/real-time-signals')
        .query({
          timeframes: 'tf1m',
          tickAnalysis: 'true',
        })
        .expect(200)
        .expect((res) => {
          res.body.signals.forEach((signal: any) => {
            if (signal.timeframe === 'tf1m') {
              expect(signal.tickAnalysis).toBeDefined();
              expect(signal.tickAnalysis).toHaveProperty('priceMomentum');
              expect(signal.tickAnalysis).toHaveProperty('volumePressure');
              expect(signal.tickAnalysis).toHaveProperty('tickFrequency');
              expect(signal.tickAnalysis).toHaveProperty('largeOrders');
            }
          });
        });
    });

    it('should not include tick analysis when disabled', () => {
      return request(app.getHttpServer())
        .get('/api/real-time-signals')
        .query({
          timeframes: 'tf1m',
          tickAnalysis: 'false',
        })
        .expect(200)
        .expect((res) => {
          res.body.signals.forEach((signal: any) => {
            expect(signal.tickAnalysis).toBeUndefined();
          });
        });
    });

    it('should calculate metadata correctly', () => {
      return request(app.getHttpServer())
        .get('/api/real-time-signals')
        .query({
          limit: 20,
        })
        .expect(200)
        .expect((res) => {
          const { metadata } = res.body;
          expect(metadata.totalSignals).toBe(res.body.signals.length);
          expect(metadata.bullishCount + metadata.bearishCount).toBe(metadata.totalSignals);
          expect(metadata.highConfidenceCount).toBeLessThanOrEqual(metadata.totalSignals);
        });
    });

    it('should include proper signal structure', () => {
      return request(app.getHttpServer())
        .get('/api/real-time-signals')
        .query({
          limit: 1,
        })
        .expect(200)
        .expect((res) => {
          if (res.body.signals.length > 0) {
            const signal = res.body.signals[0];
            expect(signal).toHaveProperty('symbol');
            expect(signal).toHaveProperty('timeframe');
            expect(signal).toHaveProperty('signalType');
            expect(signal).toHaveProperty('signalStrength');
            expect(signal).toHaveProperty('price');
            expect(signal).toHaveProperty('changePercent');
            expect(signal).toHaveProperty('volume');
            expect(signal).toHaveProperty('volumeSpike');
            expect(signal).toHaveProperty('thresholdPercentile');
            expect(signal).toHaveProperty('historicalContext');
            expect(signal).toHaveProperty('description');
            expect(signal).toHaveProperty('timestamp');
            expect(signal).toHaveProperty('confidence');

            // Validate signal type
            expect(['bullish', 'bearish', 'neutral'] as SignalType[]).toContain(signal.signalType);

            // Validate signal strength
            expect(['weak', 'medium', 'strong'] as SignalStrength[]).toContain(
              signal.signalStrength,
            );

            // Validate confidence range
            expect(signal.confidence).toBeGreaterThanOrEqual(0);
            expect(signal.confidence).toBeLessThanOrEqual(100);
          }
        });
    });

    it('should handle multiple timeframes correctly', () => {
      return request(app.getHttpServer())
        .get('/api/real-time-signals')
        .query({
          timeframes: 'tf1m,tf5m,tf15m',
          limit: 10,
        })
        .expect(200)
        .expect((res) => {
          const timeframes = res.body.signals.map((s: any) => s.timeframe);
          expect(timeframes).toContain('tf1m');
          expect(timeframes).toContain('tf5m');
          expect(timeframes).toContain('tf15m');
        });
    });

    it('should return proper error for invalid endpoint', () => {
      return request(app.getHttpServer()).get('/api/real-time-signals/invalid').expect(404);
    });

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, () =>
        request(app.getHttpServer()).get('/api/real-time-signals').query({ limit: 5 }).expect(200),
      );

      const responses = await Promise.all(requests);

      responses.forEach((res) => {
        expect(res.body).toHaveProperty('signals');
        expect(res.body).toHaveProperty('metadata');
        expect(res.body.signals.length).toBeLessThanOrEqual(5);
      });
    });

    it('should handle large limit values gracefully', () => {
      return request(app.getHttpServer())
        .get('/api/real-time-signals')
        .query({
          limit: 200, // Velký limit
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.signals.length).toBeLessThanOrEqual(200);
        });
    });

    it('should validate boolean parameters', () => {
      return request(app.getHttpServer())
        .get('/api/real-time-signals')
        .query({
          adaptiveThresholds: 'invalid',
          tickAnalysis: 'invalid',
        })
        .expect(400); // Bad Request
    });
  });

  describe('Performance tests', () => {
    it('should respond within reasonable time', () => {
      const startTime = Date.now();

      return request(app.getHttpServer())
        .get('/api/real-time-signals')
        .query({ limit: 10 })
        .expect(200)
        .expect(() => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          expect(duration).toBeLessThan(10000); // Méně než 10 sekund
        });
    });

    it('should handle rapid successive requests', async () => {
      const startTime = Date.now();

      const promises = Array.from({ length: 10 }, () =>
        request(app.getHttpServer()).get('/api/real-time-signals').query({ limit: 5 }).expect(200),
      );

      await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(30000); // Méně než 30 sekund pro 10 požadavků
    });
  });
});
