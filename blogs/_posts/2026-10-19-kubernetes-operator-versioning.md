---
title: "DocumentDB 1.0 on Kubernetes"
description: How the DocumentDB Kubernetes Operator helps teams deploy and manage clusters as part of the DocumentDB 1.0 release
date: 2026-10-19 00:01:00 -0700
featured: true
release_post: true
author: DocumentDB team
category: documentdb-blog
section: announcements
tags:
  - DocumentDB
  - Kubernetes
  - Operator
  - "1.0"
  - Release
---

As part of the DocumentDB 1.0 announcement, we're highlighting the
[DocumentDB Kubernetes Operator][operator]: a Kubernetes-native way to deploy
and manage DocumentDB clusters. Alongside the DocumentDB Engine 1.0 release,
the operator gives teams already using Kubernetes a way to bring their document
database into the same operational workflows as their applications.

## Describe your cluster, let the operator manage it

The operator extends Kubernetes with Custom Resource Definitions (CRDs). You
describe the desired DocumentDB cluster in a Kubernetes manifest, and its
controllers reconcile the deployment toward that state. Instead of treating
database setup as a collection of one-off commands, you can keep cluster
configuration in version control and apply it through your existing deployment
process.

Built on CloudNativePG, the operator brings a PostgreSQL foundation to DocumentDB
deployments and automates deployment, scaling, and cluster lifecycle management.
Helm charts provide a repeatable way to install and configure the operator itself.

## Where the operator fits

For application teams, the operator makes it easier to run a MongoDB-compatible
document database alongside Kubernetes-hosted services. For platform teams, it
provides a declarative interface for database infrastructure that fits existing
Kubernetes tooling and review processes.

Its uses extend from development environments to deployments with more demanding
availability requirements:

- **Repeatable environments:** Define cluster configuration in manifests so teams
  can review changes and reproduce deployments.
- **Day-to-day operations:** Use the operator's automated deployment, scaling,
  and lifecycle management rather than coordinating each Kubernetes resource
  manually.
- **High availability:** Configure highly available clusters using the operator's
  integration with CloudNativePG.
- **Cloud flexibility:** Use the project's deployment guides for Azure Kubernetes
  Service and Amazon Elastic Kubernetes Service, or explore multi-region and
  multi-cloud setups using fleet management and Istio.

Multi-region and multi-cloud deployments require additional infrastructure and
configuration; the repository includes guides and examples for those setups.
The operator is the cluster-management layer, not a replacement for planning
storage, networking, and availability around your workload.

## A brief note on versioning

With Engine 1.0, DocumentDB plans a long-term support (LTS) track for teams that
want a stable feature set with security patches, and a development track for teams
that want newer capabilities and can keep up with minor releases. Release
candidates are for testing, not long-term deployments. Our
[October 1 post on DocumentDB versioning][versioning] explains the proposed
support policy and upgrade paths.

Operator 1.0.0 is generally available alongside Engine 1.0, but the operator and engine keep
separate version numbers. Coordinating their releases does not make their upgrades
interchangeable: choose an operator
release compatible with your engine and Kubernetes versions, and follow the
relevant upgrade guidance for each.

## Get started

Start with the [operator installation guide][installation] for prerequisites and
Helm setup, then follow the [quick start][quickstart] to deploy your first cluster.
Pin an explicit Helm chart version, such as `--version 1.0.0`, for repeatable
installations and review that release's compatibility requirements.

Explore the [repository][operator] for platform-specific examples, report issues,
or contribute. As DocumentDB reaches 1.0, the operator brings its database
capabilities into the Kubernetes workflows your team already uses.

[operator]: https://github.com/documentdb/documentdb-kubernetes-operator
[versioning]: {{ '/blogs/posts/versioning/' | relative_url }}
[installation]: https://documentdb.io/documentdb-kubernetes-operator/latest/preview/getting-started/before-you-start/
[quickstart]: https://documentdb.io/documentdb-kubernetes-operator/latest/preview/#quickstart
