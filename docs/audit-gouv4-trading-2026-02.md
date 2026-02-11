# Audit rapide — gouv4-trading-system (MEXC + Home Assistant)

Date: 2026-02-11  
Portée analysée: contenu du dépôt Git actuel.

## 1) Constat d'inventaire

Le dépôt versionné contient uniquement un README minimal et **aucun code applicatif** (bots MEXC, intégrations Home Assistant, scripts d'orchestration, gestion secrets, tests, CI).  
Conséquence: impossible d'auditer l'implémentation réelle, de rejouer des scénarios, ou de valider la sécurité opérationnelle.

## 2) Risques majeurs identifiés (priorisés)

### P0 — Bloquants sécurité / production

1. **Absence de traçabilité du code de trading**
   - Risque: déploiements non reproductibles, régressions invisibles, incidents non investigables.
   - Correctif prioritaire: versionner les services critiques (order-router, risk-engine, exchange-client, bridge HA), avec tags de release signés.

2. **Aucun contrôle de risque explicitement versionné**
   - Risque: dépassement d'exposition, liquidation, ordres en boucle.
   - Correctif prioritaire: implémenter des garde-fous **hard-stop** côté moteur:
     - `max_notional_per_order`
     - `max_daily_loss`
     - `max_open_positions`
     - `cooldown_after_loss`
     - `kill_switch` global.

3. **Gestion des secrets non définie**
   - Risque: fuite des clés API MEXC / webhook HA, compromission compte exchange.
   - Correctif prioritaire:
     - clés en variables d'environnement + coffre (Vault/1Password/AWS Secrets Manager)
     - rotation mensuelle
     - permissions API minimales (trade only, pas de withdraw)
     - signature HMAC validée côté callbacks.

4. **Absence de journalisation et d'audit d'ordres**
   - Risque: impossibilité de prouver qui a envoyé quoi, quand, et pourquoi.
   - Correctif prioritaire: journal d'ordres immuable (append-only), corrélation `signal_id -> decision_id -> order_id -> fill_id`.

### P1 — Haute priorité fiabilité

1. **Pas de circuit breaker exchange**
   - Ajouter: retries exponentiels bornés + idempotency key + circuit breaker (open/half-open/closed).

2. **Pas de validation schéma des signaux HA**
   - Risque: automations HA malformées déclenchent des ordres inattendus.
   - Ajouter validation stricte JSON Schema + whitelist des symboles + bornes de taille de position.

3. **Absence de mode simulation/backtest canonique**
   - Risque: stratégie promue sans preuve.
   - Ajouter pipeline: backtest -> paper-trading -> prod avec critères de promotion.

4. **Aucune stratégie de reprise après incident**
   - Ajouter snapshots d'état positions/PNL + redémarrage idempotent + réconciliation au boot.

### P2 — Optimisations

1. **Observabilité limitée**
   - KPIs: latence signal->ordre, fill ratio, slippage, reject rate, drawdown, availability.

2. **Optimisation coûts API MEXC**
   - Cache des métadonnées marché (`exchangeInfo`) + batching + limitation des polling loops.

3. **Robustesse HA**
   - Isoler le bridge HA dans un worker dédié (queue interne) pour éviter le couplage avec le moteur d'exécution.

## 3) Correctifs recommandés par composant

## Moteur de trading automatisé MEXC

- **Risk Engine obligatoire avant envoi ordre**
  - Vérifier limites notional, levier max, drawdown journalier.
- **Idempotence d'ordre**
  - Clé unique par décision (`decision_hash`) pour éviter doublons sur retry réseau.
- **State reconciliation**
  - Au démarrage: pull positions ouvertes + ordres en attente et alignement état local.
- **Gestion des erreurs exchange**
  - Classifier erreurs (transient vs permanent), retry uniquement transient.

## Intégrations Home Assistant

- **Webhook sécurisé**
  - Secret dédié + HMAC SHA256 + timestamp anti-replay.
- **Contrat d'interface stable**
  - Payload versionné (`schema_version`) + validation stricte.
- **Contrôle de débit**
  - Rate-limit sur triggers HA pour éviter rafales d'ordres.
- **Mode dégradé**
  - Si HA indisponible: stopper nouvelles entrées, conserver gestion des sorties/risk-only.

## 4) Plan d'action exécutable (14 jours)

### J1-J2 (P0)
- Structurer le repo en services versionnés (`/services/order-router`, `/services/risk-engine`, `/services/ha-bridge`).
- Ajouter gestion des secrets + politique permissions API MEXC.

### J3-J5 (P0/P1)
- Implémenter `risk checks` bloquants + `kill switch`.
- Ajouter order idempotency + journal d'audit corrélé.

### J6-J8 (P1)
- Intégrer validation JSON Schema des signaux HA.
- Ajouter circuit breaker MEXC + retries bornés.

### J9-J11 (P1)
- Backtest/paper-trading pipeline + critères de go-live.

### J12-J14 (P2)
- Dashboard observabilité (latence, slippage, rejet, PnL, drawdown).
- Chaos tests API exchange/HA (timeouts, 429, payload invalide).

## 5) Critères d'acceptation minimaux avant production

- 100% des ordres passent via risk-engine.
- Aucun secret en clair dans repo ou logs.
- Redémarrage service sans doublon d'ordre.
- Rejeu d'un incident possible en < 30 minutes via logs corrélés.
- Backtest + paper-trading validés sur période représentative.

## 6) Prochaines informations nécessaires pour un audit de code complet

- Arborescence réelle des services (bot, API, HA bridge).
- Fichiers de config (env, docker, compose, CI).
- Exemples de payload HA -> bot et réponses MEXC.
- Politique actuelle de gestion des clés API et rotation.
