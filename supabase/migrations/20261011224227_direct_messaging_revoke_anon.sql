-- Defense in depth flagged by the advisor right after 20261011224102_direct_messaging:
-- CREATE FUNCTION grants EXECUTE to PUBLIC (which includes `anon`) unless
-- revoked, same as this codebase already does for export_my_gdpr_data()
-- (20260922090000_gdpr_self_service.sql). start_direct_chat() writes real
-- rows and the other two read real chat membership, so none of the three
-- should be callable without a logged-in session.
revoke execute on function public.start_direct_chat(uuid, text) from public;
revoke execute on function public.get_chat_room_peer_names(uuid[]) from public;
revoke execute on function public.get_direct_message_contacts() from public;
