import { developmentUsers } from "../data/users.js";
import { developmentRequests} from "../data/requests.js"

export function findUserById(id: string) {
    return developmentUsers.find((user) => user.id === id);
}

export function listRequests() {
    return [...developmentRequests]
}

export function findRequestById(id: string){
    return developmentRequests.find((request) => request.id === id);
}

export function createRequest(newRequest: any){
    developmentRequests.push(newRequest);
    return newRequest;
}

export function updareRequest(id: string, updates: any){
    const index = developmentRequests.findIndex((request) => request.id === id);

    if (index === -1) {
        return null
    }
    developmentRequests[index] = {
        ...developmentRequests[index],
        ...updates,
        UpdatedAt: new Data(). toISOString(),
    };

    return developmentRequests[index];
}

export function addAuditEvent(requestId: string, event: any) {
    const index = developmentRequests.findIndex((request) => request.id === requestId);

    if (index === -1) {
        return null;
    }
    developmentRequests[index].auditEvents.push(event);

    return developmentRequests[index];
}