import { createHash } from 'crypto';

interface GitHubTreeEntry {
    path: string;
    sha: string;
    type: string;
    size?: number;
}

export class NexusIngestor {
    private baseUrl: string = "https://raw.githubusercontent.com";
    private localManifest: Map<string, string> = new Map();

    constructor(
        private owner: string,
        private repo: string,
        private token: string
    ) {}

    public calculateGitSha(content: Buffer): string {
        const header = `blob ${content.length}\0`;
        const store = Buffer.concat([Buffer.from(header), content]);
        return createHash('sha1').update(store).digest('hex');
    }

    private async requestWithRetry(url: string, retries = 5): Promise<any> {
        let delay = 1000;
        for (let i = 0; i < retries; i++) {
            const response = await fetch(url, {
                headers: { 'Authorization': `token ${this.token}` }
            });

            if (response.status === 403) {
                const secondaryLimit = response.headers.get('retry-after');
                const primaryReset = response.headers.get('X-RateLimit-Reset');
                
                let waitTime = 0;
                if (secondaryLimit) {
                    waitTime = parseInt(secondaryLimit) * 1000;
                } else if (primaryReset) {
                    waitTime = (parseInt(primaryReset) * 1000) - Date.now();
                }

                const jitter = Math.random() * 200;
                const backoff = Math.max(waitTime, delay + jitter);
                
                console.warn(`Rate limited. Retrying in ${backoff}ms...`);
                await new Promise(res => setTimeout(res, backoff));
                delay *= 2;
                continue;
            }
            return response.json();
        }
        throw new Error("Maximum retries exceeded");
    }

    public async syncRepository(branch: string, localFiles: Map<string, Buffer>) {
        const url = `https://api.github.com/repos/${this.owner}/${this.repo}/git/trees/${branch}?recursive=1`;
        const data = await this.requestWithRetry(url);
        const remoteTree: GitHubTreeEntry[] = data.tree;

        const syncList: string[] = [];
        for (const entry of remoteTree) {
            if (entry.type !== 'blob') continue;

            const cachedSha = this.localManifest.get(entry.path);
            if (cachedSha === entry.sha) continue;

            const content = localFiles.get(entry.path);
            if (!content || this.calculateGitSha(content) !== entry.sha) {
                syncList.push(entry.path);
            }
            
            this.localManifest.set(entry.path, entry.sha);
        }
        return syncList;
    }

    public verifyBundleIntegrity(bundleJson: any, localFiles: Map<string, Buffer>): boolean {
        const statement = bundleJson.dsseEnvelope.payload.statement;
        if (statement._type !== 'https://in-toto.io/Statement/v1') return false;

        for (const subject of statement.subject) {
            const fileContent = localFiles.get(subject.name);
            if (!fileContent) return false;

            const actualHash = createHash('sha256').update(fileContent).digest('hex');
            if (actualHash !== subject.digest.sha256) {
                console.error(`Integrity mismatch for ${subject.name}`);
                return false;
            }
        }
        return true;
    }
}
