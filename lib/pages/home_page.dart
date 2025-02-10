import 'package:flutter/material.dart';
import 'package:sqflite/sqflite.dart';
import '../repositories/meta_repository.dart';
import '../repositories/set_repository.dart';
import '../models/meta_model.dart';
import '../models/set_model.dart';

class HomePage extends StatefulWidget {
  final Database database;

  const HomePage({super.key, required this.database});

  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  late MetaRepository _metaRepository;
  late SetRepository _setRepository;

  Future<Map<String, dynamic>> _fetchDashboardData() async {
    final MetaModel? meta = await _metaRepository.getMeta();
    final List<SetModel> sets = await _setRepository.getAllSets();
    return {
      'meta': meta,
      'sets': sets,
    };
  }

  @override
  void initState() {
    super.initState();
    _metaRepository = MetaRepository(db: widget.database);
    _setRepository = SetRepository(db: widget.database);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Codex Etherium Dashboard"),
      ),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _fetchDashboardData(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text("Error: ${snapshot.error}"));
          } else {
            final MetaModel? meta = snapshot.data!['meta'] as MetaModel?;
            final List<SetModel> sets =
                snapshot.data!['sets'] as List<SetModel>;

            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Database Info",
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  meta != null
                      ? Text(
                          "Version: ${meta.version ?? "Unknown"}\n"
                          "Last Updated: ${meta.date?.toIso8601String().substring(0, 10) ?? "Unknown"}",
                          style: const TextStyle(fontSize: 16),
                        )
                      : const Text("No meta information available.",
                          style: TextStyle(fontSize: 16)),
                  const SizedBox(height: 24),
                  const Text(
                    "Available Sets",
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  sets.isNotEmpty
                      ? ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: sets.length,
                          separatorBuilder: (context, index) => const Divider(),
                          itemBuilder: (context, index) {
                            final SetModel set = sets[index];
                            return ListTile(
                              title: Text(set.name ?? "Unnamed Set"),
                              subtitle: Text("Code: ${set.code}"),
                            );
                          },
                        )
                      : const Text("No sets found.",
                          style: TextStyle(fontSize: 16)),
                ],
              ),
            );
          }
        },
      ),
    );
  }
}
