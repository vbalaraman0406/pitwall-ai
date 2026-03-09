declare const api: import("axios").AxiosInstance;
export declare const getRaces: (year: number) => Promise<import("axios").AxiosResponse<any, any, {}>>;
export declare const getRaceResults: (year: number, round: number, session?: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
export declare const getLaps: (year: number, round: number, driver?: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
export declare const getTelemetry: (year: number, round: number, driver: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
export declare const getStrategy: (year: number, round: number) => Promise<import("axios").AxiosResponse<any, any, {}>>;
export declare const getDrivers: (year: number) => Promise<import("axios").AxiosResponse<any, any, {}>>;
export declare const getDriverStats: (year: number, code: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
export declare const compareDrivers: (year: number, drivers: string[]) => Promise<import("axios").AxiosResponse<any, any, {}>>;
export default api;
//# sourceMappingURL=api.d.ts.map