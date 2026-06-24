export interface ReportFollowerRepository{
    follow(userPublicId: string, reportPublicId: string): Promise<void>;
    unfollow(userPublicId: string, reportPublicId: string): Promise<void>;
    isFollowing(userPublicId: string, reportPublicId: string): Promise<boolean>;
    findFollowerPublicIdsByReportPublicId(reportPublicId: string): Promise<string[]>
}