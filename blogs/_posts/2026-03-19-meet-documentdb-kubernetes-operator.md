---
title: Meet the DocumentDB Kubernetes Operator
description: Preview an open-source operator that brings declarative deployment, secure connectivity, high availability, backup and restore, and automated multi-cloud deployment to DocumentDB on Kubernetes.
date: 2026-03-19
featured: false
author: DocumentDB team
category: documentdb-blog
section: announcements
tags:
  - Kubernetes
  - Operator
  - DocumentDB
  - Open Source
---

**Update, October 19, 2026:** The DocumentDB Kubernetes Operator 1.0.0 is generally available. The `documentdb.io/preview` API version and the `preview` in the docs URLs are names kept for compatibility. See [DocumentDB 1.0 on Kubernetes]({{ '/blogs/posts/kubernetes-operator-versioning/' | relative_url }}).
The DocumentDB Kubernetes Operator brings MongoDB API compatible document database management to any Kubernetes cluster — with declarative deployment, automatic high availability, backup and restore, TLS, and a documented multi-cloud deployment path across AKS, GKE, and EKS — all fully open source under the MIT license.

[DocumentDB](https://github.com/documentdb/documentdb) is an open-source, MongoDB API compatible document database engine built on PostgreSQL, governed by the Linux Foundation. It powers vCore-based Azure Cosmos DB for MongoDB and provides native support for BSON data types, aggregation pipelines, change streams, vector search, and ACID transactions. The Kubernetes Operator runs and manages DocumentDB on Kubernetes: when you deploy a cluster, it creates and manages PostgreSQL instances, the DocumentDB Gateway, and the supporting Kubernetes resources around them. The gateway translates the MongoDB wire protocol, so existing MongoDB drivers — PyMongo, Node.js, Java, Go, C++ — work without code changes, and teams can keep using familiar clients such as `mongosh`.

## Why this matters

Kubernetes teams have strong patterns for stateless applications, but data services often still depend on custom runbooks and fragile operational glue. The DocumentDB Kubernetes Operator closes that gap for DocumentDB by giving platform teams a single declarative control surface for deployment, availability, security, and recovery.

With the preview release, you can:

- install the operator with Helm
- have the Helm chart install CloudNativePG as a dependency
- deploy DocumentDB through a Kubernetes custom resource
- connect with `mongosh` and other MongoDB API compatible tooling
- explore a public multi-cloud deployment playground spanning AKS, GKE, and EKS
- manage backup, restore, TLS, and promotion workflows through Kubernetes-native APIs

## From quickstart to useful data fast

The quickstart is intentionally direct. Install `cert-manager`, install the operator, create a Secret for gateway credentials, and apply a `DocumentDB` resource. The public preview docs target Kubernetes 1.35+ and call out local development with `kind` (v0.31+) and `minikube`, while also showing cloud-friendly access patterns through `LoadBalancer` services on AKS, EKS, and GKE.

At the heart of that flow is a simple custom resource:

```yaml
apiVersion: documentdb.io/preview
kind: DocumentDB
metadata:
  name: documentdb-preview
  namespace: documentdb-preview-ns
spec:
  nodeCount: 1
  instancesPerNode: 1
  documentDbCredentialSecret: documentdb-credentials
  resource:
    storage:
      pvcSize: 10Gi
  exposeViaService:
    serviceType: ClusterIP
```

Once the cluster reports a healthy state, you can connect locally with port forwarding or expose it through a load balancer in supported environments. The result is a much shorter path from cluster creation to a live MongoDB API compatible endpoint.

## Built for day-two operations

Bringing up a cluster is only the beginning, so the operator is opinionated about day-two workflows as well.

Set `instancesPerNode: 3` and the operator creates one primary instance and two replicas for local high availability and automatic failover. Use `Backup` and `ScheduledBackup` resources for on-demand and scheduled backups, retention policies, and restore workflows into a new cluster. And when operators need visibility into what is happening, the `kubectl documentdb` plugin adds purpose-built commands: `status` for cluster-wide inspection, `events` for event triage, and `promote` for controlled primary promotion.

That makes the operator interesting not only for first deployment, but for the operational rhythm that follows: health checks, recovery planning, planned changes, and repeatable workflows that fit naturally into Kubernetes.

## Security and connectivity without reinventing the basics

Secure connectivity is built into the model from the start. The DocumentDB gateway always encrypts client connections; the TLS mode controls how certificates are managed. In practice, that means teams can choose the workflow that matches their environment:

- `SelfSigned` for development and test environments
- `CertManager` for clusters that already standardize on cert-manager
- `Provided` for organizations that manage certificates through their own PKI processes

The same pattern carries into networking. The docs cover local development through `ClusterIP` plus port forwarding, and cloud exposure through `LoadBalancer` services where that model makes sense. The operator keeps those choices declarative instead of forcing each team to reinvent them.

## A standout multi-cloud deployment story

The operator already has a public multi-cloud deployment playground spanning AKS, GKE, and EKS. With a single `./deploy.sh` workflow, teams can stand up the infrastructure, join clusters into AKS Fleet, configure Istio multi-cluster service mesh, and prepare the operator for cross-cloud replication. A companion `./deploy-documentdb.sh` workflow then deploys DocumentDB, selects a primary cluster, and outputs connection details plus failover commands.

That is what makes the multi-cloud story worth highlighting: this is not just a vague promise of "runs anywhere," but a concrete, hands-on path to run a MongoDB API compatible database across the three major managed Kubernetes platforms. And for hybrid environments, the repo also includes a KubeFleet-based guide for spanning AKS and an on-premises Kubernetes cluster.

Just as importantly, the operator keeps sensitive workflows explicit. Promotion is an intentional operational action, surfaced through Kubernetes resources and the `kubectl documentdb promote` workflow, which is often exactly the right design when changes cross infrastructure or compliance boundaries.

## Why try it now

The project is in public preview, which makes now the ideal time to evaluate it and influence its direction before general availability. This preview gives you a concrete way to see how DocumentDB fits into your Kubernetes platform: start locally, inspect the declarative control model, test backup and restore, evaluate TLS options, and explore the full operator experience.

The public docs are clear that the operator is not yet recommended for production workloads — but that is exactly why early feedback matters. Try it, push on the edges, and [let the team know](https://github.com/documentdb/documentdb-kubernetes-operator/issues) what you need for GA.

## Start exploring

- [GitHub repository](https://github.com/documentdb/documentdb-kubernetes-operator) — star the project, file issues, and contribute
- [Quickstart guide](https://github.com/documentdb/documentdb-kubernetes-operator/blob/main/docs/operator-public-documentation/preview/index.md)
- [Backup and restore guide](https://github.com/documentdb/documentdb-kubernetes-operator/blob/main/docs/operator-public-documentation/preview/operations/backup-and-restore.md)
- [kubectl-documentdb plugin](https://github.com/documentdb/documentdb-kubernetes-operator/blob/main/docs/operator-public-documentation/preview/kubectl-plugin.md)
- [TLS configuration guide](https://github.com/documentdb/documentdb-kubernetes-operator/blob/main/docs/operator-public-documentation/preview/configuration/tls.md)
- [Multi-cloud deployment playground (AKS + GKE + EKS)](https://github.com/documentdb/documentdb-kubernetes-operator/blob/main/documentdb-playground/multi-cloud-deployment/README.md)
